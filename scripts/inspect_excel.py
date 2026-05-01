import pandas as pd
import os

DATA_DIR = 'c:/Users/pc/OneDrive/Documents/New folder (4)/data'

files_to_inspect = [
    'Daily Collection Sheet Nov-25.xlsx',
    'Received Delivery Report.xlsx',
    'Clear Cheque List.xlsx'
]

for file in files_to_inspect:
    path = os.path.join(DATA_DIR, file)
    if os.path.exists(path):
        print(f"\n--- Inspecting {file} ---")
        try:
            # Read first 10 rows without header to see layout
            df = pd.read_excel(path, header=None, nrows=10)
            print(df)
        except Exception as e:
            print(f"Error reading {file}: {e}")
    else:
        print(f"\nFile not found: {file}")
