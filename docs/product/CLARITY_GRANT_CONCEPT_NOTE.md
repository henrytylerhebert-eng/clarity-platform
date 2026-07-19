# Clarity: Grant-Alignment Concept Note
**Connecting Law Enforcement, Mobile Crisis, and Behavioral Health Infrastructure**

*This is a strategic product document demonstrating how the Clarity platform fulfills the cross-system data coordination requirements of major federal funding streams (e.g., DOJ JMHCP, SAMHSA MCTP).*

---

## 1. Executive Summary
Federal mandates are pushing municipalities to divert mental health and substance-use crises away from jails and emergency rooms. However, while funding exists to hire co-responders (like the LPSO Crisis Intervention Team) and deploy mobile crisis units (like The Ness Center), the **digital infrastructure** connecting these agencies is fundamentally broken. Clarity solves this by providing a governed, HIPAA-compliant routing and directory platform that allows law enforcement to safely hand off behavioral health cases to appropriate community providers without losing critical context or violating privacy boundaries.

## 2. The Problem
Currently, law enforcement officers and 911 dispatchers act as the default intake for behavioral health crises. 
* **Siloed Dispatch:** When an officer encounters a crisis, they often lack visibility into whether a mobile crisis team or a specific psychiatric facility has capacity.
* **Blind Handoffs:** If an officer diverts a patient to a behavioral health clinic or ER, they often drop them off without a secure way to transmit field notes, safety risks, or prior interaction history.
* **Liability & Privacy:** Police CAD (Computer-Aided Dispatch) systems contain criminal data that cannot be freely shared with civilian healthcare workers, while healthcare EMRs contain PHI that cannot be freely shared with police.

## 3. The Proposed Solution (Clarity Platform)
Clarity is a governed coordination directory and prescreen routing engine. It acts as the secure middleware between public safety and public health.
* **Network Directory CRM:** A maintained, source-backed directory of all regional mobile crisis providers, inpatient psych facilities, and elderly protective services (APS), complete with exclusion criteria and capabilities.
* **Field Prescreen Handoff:** A lightweight, mobile-friendly UI that allows an officer or co-responder to capture essential behavioral health field facts (minus criminal history) and securely package them for a receiving facility.
* **Governed Routing:** Clarity strictly enforces Role-Level Security (RLS). A police officer only sees what is necessary for field diversion, while a receiving intake coordinator receives the clinical packet needed for admission readiness.

## 4. Strategic Alignment with Federal Grants
Clarity's architecture maps directly onto the deliverables required by the two largest federal behavioral health funding streams:

### A. DOJ Bureau of Justice Assistance (BJA) - JMHCP
* **Grant Goal:** Cross-system collaboration between criminal justice and mental health agencies.
* **Clarity Fit:** Clarity is the literal "collaboration infrastructure." If a Sheriff's Department wins a JMHCP grant for a co-responder model, Clarity is the software they procure to track those co-responses, measure jail diversions, and transmit patient handoffs securely to partnering clinics.

### B. SAMHSA - Mobile Crisis Team Partnerships (MCTP)
* **Grant Goal:** Establish structured partnerships that reduce reliance on law enforcement and ERs.
* **Clarity Fit:** Clarity formalizes these partnerships. Instead of relying on ad-hoc phone calls, Clarity provides a digital referral pathway from the 988/Crisis Hub directly to the mobile crisis units in the field, tracking response times and outcomes.

## 5. Data Governance & Privacy Assurances
A major barrier to cross-agency software is data liability. Clarity is built around a **Platform Memory System** and strict synthetic-boundary rules:
* **No Autonomous Admissions:** Clarity routes context, but humans make the final placement decisions.
* **Role-Based Views:** Police do not see a patient's longitudinal medical record; hospitals do not see the police's criminal database. Clarity only brokers the specific `Referral Packet` authorized for the immediate crisis handoff.
* **Source-Backed Directory:** Facility capacity and capabilities are maintained via strict review-gates, ensuring officers are not routing patients to closed or inappropriate facilities.

## 6. Expected Outcomes & Metrics for Grant Reporting
Agencies deploying Clarity alongside their CIT or Mobile Crisis programs will be able to easily pull reports for federal grant compliance, including:
1. **Diversion Rate:** Number of individuals routed to community care instead of the parish jail.
2. **ER Boarding Reduction:** Number of individuals handed off directly to behavioral health intake rather than waiting 24+ hours in a medical emergency room.
3. **Time-to-Treatment:** The latency between law enforcement field contact and behavioral health provider acceptance.
