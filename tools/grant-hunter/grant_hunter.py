import asyncio
import os
import json
from pathlib import Path
from google.antigravity import Agent, LocalAgentConfig, types, ToolContext

# --- 1. Product Ingestion ---
def load_product_context() -> str:
    """Loads the Clarity product documentation to serve as the ground-truth for the agents."""
    base_path = Path(__file__).parent.parent.parent / "docs" / "product"
    
    concept_note = base_path / "CLARITY_GRANT_CONCEPT_NOTE.md"
    system_design = base_path / "CLARITY_DIRECTORY_CRM_SYSTEM_DESIGN.md"
    
    context = "=== CLARITY PRODUCT CONTEXT ===\n\n"
    if concept_note.exists():
        context += f"--- CLARITY_GRANT_CONCEPT_NOTE ---\n{concept_note.read_text()}\n\n"
    if system_design.exists():
        context += f"--- CLARITY_DIRECTORY_CRM_SYSTEM_DESIGN ---\n{system_design.read_text()}\n\n"
        
    return context

# --- 2. Custom Tools ---
def record_grant_evaluation(grant_name: str, confidence_ratio: float, win_probability: float, missing_features: list[str], ctx: ToolContext) -> str:
    """Records the mathematical evaluation of a grant opportunity.
    
    Args:
        grant_name: The name of the grant opportunity.
        confidence_ratio: A score from 0.0 to 1.0 representing how well Clarity solves the funder's problem.
        win_probability: A score from 0.0 to 1.0 representing the likelihood of winning based on eligibility.
        missing_features: A list of product features Clarity must build to win this grant.
        ctx: The tool context.
    """
    grants = ctx.get_state("evaluated_grants", {})
    grants[grant_name] = {
        "confidence_ratio": confidence_ratio,
        "win_probability": win_probability,
        "missing_features": missing_features
    }
    ctx.set_state("evaluated_grants", grants)
    
    report = f"Recorded evaluation for {grant_name}. Confidence: {confidence_ratio}, Win Prob: {win_probability}."
    if missing_features:
        report += f" Required product updates logged: {', '.join(missing_features)}."
        
        # Write the product development updates to a file
        out_file = Path(__file__).parent / "PRODUCT_DEVELOPMENT_UPDATES.md"
        with open(out_file, "a") as f:
            f.write(f"### Needed for {grant_name}\n")
            for feature in missing_features:
                f.write(f"- {feature}\n")
            f.write("\n")
            
    return report

def get_evaluated_grants(ctx: ToolContext) -> str:
    """Returns a JSON string of all evaluated grants and their scores."""
    grants = ctx.get_state("evaluated_grants", {})
    return json.dumps(grants, indent=2)

# --- 3. Agent Orchestration ---
async def main():
    print("Initializing Clarity Grant Hunter Multi-Agent System...")
    product_context = load_product_context()
    
    system_instructions = (
        "You are the Director of the Clarity Grant Hunting division. Your job is to find non-dilutive capital.\n"
        "You have deep knowledge of the Clarity Platform based on the provided product context.\n"
        "When presented with a grant opportunity, you must:\n"
        "1. Analyze the grant against the Clarity product.\n"
        "2. Calculate a 'confidence_ratio' (0.0-1.0) and 'win_probability' (0.0-1.0).\n"
        "3. Identify any missing product features needed to win.\n"
        "4. Use the `record_grant_evaluation` tool to save your math and log product development updates.\n"
        "5. If the confidence ratio is > 0.7, USE A SUBAGENT (e.g., 'DOJ Expert', 'SAMHSA Expert') to draft a 3-paragraph proposal concept.\n"
        f"\n{product_context}"
    )

    config = LocalAgentConfig(
        system_instructions=system_instructions,
        tools=[record_grant_evaluation, get_evaluated_grants],
        capabilities=types.CapabilitiesConfig(
            enable_subagents=True, # Allows the Director to spawn expert grant writers
        )
    )

    async with Agent(config) as director:
        print("\nGrant Director is ready. (Type 'exit' to quit)")
        while True:
            user_input = input("\nEnter a grant description or URL to evaluate:\n> ")
            if user_input.lower() in ['exit', 'quit']:
                break
                
            print("\nDirector Agent is thinking (and potentially spawning subagents)...")
            response = await director.chat(user_input)
            
            async for chunk in response:
                print(chunk, end="", flush=True)
            print("\n")

if __name__ == "__main__":
    pass
        
    asyncio.run(main())
