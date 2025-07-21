from django.apps import AppConfig
import logging
import os
import csv

logger = logging.getLogger(__name__)

# Global variable for LSE company list (will be loaded on startup)
company_list = []

# Using the existing class name from your provided file
class PaperTradeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stocks'

    def ready(self):
        # This method is called once Django fully starts up and loads apps.
        # We will attempt to load the company list here.
        self._load_lse_companies()
        
        print("**************************************************")
        print(f"* STOCKS APP READY: Loaded {len(company_list)} LSE companies. *")
        print("**************************************************")

    def _load_lse_companies(self):
        """
        Loads LSE company data from a local CSV file.
        It expects a CSV with 'TICKER' and 'NAME' columns.
        """
        global company_list
        # Construct the path to the CSV file relative to this apps.py file
        csv_path = os.path.join(os.path.dirname(__file__), 'stocks_symbols.csv')
        temp_company_list = []

        if not os.path.exists(csv_path):
            logger.error(f"ERROR: lse_companies.csv not found at {csv_path}. Search functionality will be limited.")
            return

        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                # Check for required headers
                if 'symbol' not in reader.fieldnames or 'name' not in reader.fieldnames:
                    logger.error(f"ERROR: {csv_path} is missing 'symbol' or 'name' columns. Found: {reader.fieldnames}")
                    return

                for row in reader:
                    symbol = row.get('symbol', '').strip()
                    name = row.get('name', '').strip()
                    if symbol and name:
                        temp_company_list.append({"symbol": symbol, "name": name})
            
            company_list = temp_company_list
            logger.info(f"SUCCESS: Loaded {len(company_list)} LSE companies from {csv_path}.")
        except Exception as e:
            logger.error(f"ERROR: An unexpected error occurred loading LSE companies from {csv_path}: {e}", exc_info=True)
            company_list = []


