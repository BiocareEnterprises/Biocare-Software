import pandas as pd
import os

file_path = 'c:/Users/pc/OneDrive/Documents/New folder (4)/data/Daily Collection Sheet Nov-25.xlsx'

for h in [8, 9, 10]:
    print(f"\n--- Testing header={h} ---")
    try:
        df = pd.read_excel(file_path, header=h, nrows=2)
        print(df.columns.tolist())
    except Exception as e:
        print(e)
