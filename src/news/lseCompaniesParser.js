// lseCompaniesParser.js
// LSE Companies data and parsing utilities

class LSECompaniesParser {
    constructor() {
        // Major LSE companies with their symbols and search queries
        this.companies = [
            {
                symbol: 'SHEL',
                name: 'Shell plc',
                searchQuery: 'Shell energy oil gas',
                sector: 'Energy',
                isMajor: true
            },
            {
                symbol: 'AZN',
                name: 'AstraZeneca PLC',
                searchQuery: 'AstraZeneca pharmaceutical drug',
                sector: 'Healthcare',
                isMajor: true
            },
            {
                symbol: 'BP',
                name: 'BP p.l.c.',
                searchQuery: 'BP oil energy petroleum',
                sector: 'Energy',
                isMajor: true
            },
            {
                symbol: 'HSBA',
                name: 'HSBC Holdings plc',
                searchQuery: 'HSBC bank banking financial',
                sector: 'Financial Services',
                isMajor: true
            },
            {
                symbol: 'ULVR',
                name: 'Unilever PLC',
                searchQuery: 'Unilever consumer goods',
                sector: 'Consumer Goods',
                isMajor: true
            },
            {
                symbol: 'LLOY',
                name: 'Lloyds Banking Group plc',
                searchQuery: 'Lloyds bank banking financial',
                sector: 'Financial Services',
                isMajor: true
            },
            {
                symbol: 'VOD',
                name: 'Vodafone Group Plc',
                searchQuery: 'Vodafone telecom mobile',
                sector: 'Telecommunications',
                isMajor: true
            },
            {
                symbol: 'BARC',
                name: 'Barclays PLC',
                searchQuery: 'Barclays bank banking financial',
                sector: 'Financial Services',
                isMajor: true
            },
            {
                symbol: 'GSK',
                name: 'GSK plc',
                searchQuery: 'GSK GlaxoSmithKline pharmaceutical',
                sector: 'Healthcare',
                isMajor: true
            },
            {
                symbol: 'BT-A',
                name: 'BT Group plc',
                searchQuery: 'BT Group telecom telecommunications',
                sector: 'Telecommunications',
                isMajor: true
            },
            {
                symbol: 'TSCO',
                name: 'Tesco PLC',
                searchQuery: 'Tesco retail supermarket',
                sector: 'Retail',
                isMajor: true
            },
            {
                symbol: 'RIO',
                name: 'Rio Tinto Group',
                searchQuery: 'Rio Tinto mining metals',
                sector: 'Mining',
                isMajor: true
            },
            {
                symbol: 'RDSB',
                name: 'Royal Dutch Shell',
                searchQuery: 'Royal Dutch Shell oil energy',
                sector: 'Energy',
                isMajor: true
            },
            {
                symbol: 'PRU',
                name: 'Prudential plc',
                searchQuery: 'Prudential insurance financial',
                sector: 'Financial Services',
                isMajor: true
            },
            {
                symbol: 'RDSA',
                name: 'Royal Dutch Shell',
                searchQuery: 'Royal Dutch Shell oil petroleum',
                sector: 'Energy',
                isMajor: true
            },
            // Additional companies
            {
                symbol: 'LGEN',
                name: 'Legal & General Group Plc',
                searchQuery: 'Legal General insurance pension',
                sector: 'Financial Services',
                isMajor: false
            },
            {
                symbol: 'AVST',
                name: 'Avast Plc',
                searchQuery: 'Avast cybersecurity antivirus',
                sector: 'Technology',
                isMajor: false
            },
            {
                symbol: 'IAG',
                name: 'International Consolidated Airlines Group',
                searchQuery: 'IAG British Airways airline',
                sector: 'Travel & Leisure',
                isMajor: false
            },
            {
                symbol: 'STAN',
                name: 'Standard Chartered PLC',
                searchQuery: 'Standard Chartered bank banking',
                sector: 'Financial Services',
                isMajor: false
            },
            {
                symbol: 'NWG',
                name: 'NatWest Group plc',
                searchQuery: 'NatWest bank banking financial',
                sector: 'Financial Services',
                isMajor: false
            }
        ];
    }

    getAllCompanies() {
        return this.companies;
    }

    getMajorCompanies() {
        return this.companies.filter(company => company.isMajor);
    }

    getCompanyBySymbol(symbol) {
        return this.companies.find(company =>
            company.symbol.toLowerCase() === symbol.toLowerCase()
        );
    }

    getCompaniesBySector(sector) {
        return this.companies.filter(company =>
            company.sector.toLowerCase() === sector.toLowerCase()
        );
    }

    searchCompanies(query) {
        const searchTerm = query.toLowerCase();
        return this.companies.filter(company =>
            company.name.toLowerCase().includes(searchTerm) ||
            company.symbol.toLowerCase().includes(searchTerm) ||
            company.searchQuery.toLowerCase().includes(searchTerm)
        );
    }

    getCompanyNames() {
        return this.companies.map(company => company.name);
    }

    getCompanySymbols() {
        return this.companies.map(company => company.symbol);
    }
}

// Create and export a singleton instance
const lseCompaniesParser = new LSECompaniesParser();

export default lseCompaniesParser;
