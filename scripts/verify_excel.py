import requests
import sys

def test_excel_export():
    url = 'http://localhost:5000/api/reports/sales?format=xlsx'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("Response status: 200 OK")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            print(f"Content-Disposition: {response.headers.get('Content-Disposition')}")
            
            # Check if it looks like a zip file (Excel files are zips)
            if response.content[:2] == b'PK':
                print("Content looks like a valid ZIP/XLSX file.")
            else:
                print("Content does NOT look like a ZIP/XLSX file.")
                print(f"First 10 bytes: {response.content[:10]}")
        else:
            print(f"Failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_excel_export()
