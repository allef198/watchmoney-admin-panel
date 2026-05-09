
import { useState } from 'react';

const LOG_TYPES = ['Todos', 'Saque', 'Usuário', 'Pontos', 'Configuração', 'Aviso', 'Anti-Fraude', 'Exportação', 'Outro'];

const LogFilters = ({ onFilterChange, onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('Todos');

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        onSearch(term);
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        setTypeFilter(type);
        onFilterChange({ type });
    };

    return (
        <div className="filters-bar card card-body">
            <div className="filter-group">
                <label htmlFor="search-logs">Buscar</label>
                <input 
                    type="text" 
                    id="search-logs"
                    placeholder="Buscar por UID, email, ação..." 
                    value={searchTerm}
                    onChange={handleSearch}
                    className="form-control"
                />
            </div>
            <div className="filter-group">
                <label htmlFor="type-filter">Tipo de Ação</label>
                <select id="type-filter" value={typeFilter} onChange={handleTypeChange} className="form-control">
                    {LOG_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default LogFilters;
