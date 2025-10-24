function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search-input">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
    </div>
  );
}

export default SearchInput;
