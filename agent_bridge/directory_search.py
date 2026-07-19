import csv
import argparse
import os

CSV_DIR = "/Users/tylerhebert/Library/CloudStorage/GoogleDrive-henrytylerhebert@gmail.com/My Drive/Clarity-Platform/Segmented_Directories"

FILES = {
    "behavioral": "Behavioral_Health_and_Addiction.csv",
    "hospital": "Hospitals_and_Acute_Care.csv",
    "nursing": "Nursing_Rehab_and_LTC.csv",
    "primary": "Primary_Care_and_Clinics.csv",
    "specialist": "Specialists_and_Other.csv"
}

def search_directory(category, query, max_results=10):
    if category not in FILES:
        print(f"Error: Category must be one of {list(FILES.keys())}")
        return
        
    file_path = os.path.join(CSV_DIR, FILES[category])
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return
        
    query = query.lower()
    results = []
    
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Search across all values in the row
            if any(query in str(val).lower() for val in row.values()):
                results.append(row)
                if len(results) >= max_results:
                    break
                    
    if not results:
        print(f"No results found for '{query}' in {category} directory.")
        return
        
    print(f"Found {len(results)} results (showing up to {max_results}):\n")
    for idx, res in enumerate(results, 1):
        print(f"--- Result {idx} ---")
        print(f"Name: {res.get('Facility Name', 'N/A')}")
        print(f"Category: {res.get('Primary Service Category', 'N/A')}")
        print(f"Location: {res.get('City', 'N/A')}, {res.get('Physical Address', 'N/A')}")
        print(f"Phone: {res.get('Intake / Admissions Phone', 'N/A')}")
        print(f"Email: {res.get('Admin Email Contact', 'N/A')}")
        print(f"Medicare: {res.get('Medicare Enrolled (Y/N)', 'Unknown')}")
        print("")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search the Clarity Platform segmented directories.")
    parser.add_argument("--category", required=True, choices=FILES.keys(), help="The classification directory to search.")
    parser.add_argument("--query", required=True, help="Search term (e.g. 'lafayette', 'acadian', 'addiction').")
    parser.add_argument("--limit", type=int, default=10, help="Max results to return.")
    
    args = parser.parse_args()
    search_directory(args.category, args.query, args.limit)
