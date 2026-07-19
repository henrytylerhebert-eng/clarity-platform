# Clarity Platform: Segmented CRM Directories

To prevent token-limit exhaustion and context-window overload when searching for referral resources, the master CRM directory (19,000+ records) has been partitioned into 5 highly focused classifications.

DO NOT attempt to read the raw CSV files directly. 

Instead, use the provided Bridge Script to query the specific classification directory you need.

## How to use the Bridge Script
Execute the following python script from the `agent_bridge` directory to instantly search a classification:

```bash
python agent_bridge/directory_search.py --category <CATEGORY> --query "<SEARCH_TERM>" --limit 10
```

### Available Categories (`--category`):
- `behavioral`: Psychiatry, Addiction Medicine, Social Workers, Opioid Treatment, Psych Hospitals. (1,938 records)
- `hospital`: Acute Care Hospitals, Emergency Medicine, Critical Access. (1,153 records)
- `nursing`: Nursing Homes, Rehab, Hospice, Assisted Living, Physical Therapy. (1,879 records)
- `primary`: Internal Medicine, Family Practice, Nurse Practitioners. (5,874 records)
- `specialist`: Surgeons, Optometry, Cardiology, and other specialists. (8,176 records)

### Examples:
Find addiction treatment centers in Lafayette:
`python agent_bridge/directory_search.py --category behavioral --query "lafayette"`

Find an acute care hospital by name:
`python agent_bridge/directory_search.py --category hospital --query "Ochsner"`

Find nursing homes that accept Medicare:
`python agent_bridge/directory_search.py --category nursing --query "Y"`

## Important Note on CRM Profiles
These files represent the *baseline* dataset. If you need to formally update a facility's interaction history (e.g., they denied a referral due to capacity), you must use the `FacilityProfile` and `Referral` models in the `clarity-platform` PostgreSQL database via Prisma, NOT these flat files. These files are strictly for read-only triage discovery.
