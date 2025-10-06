let execa = async (...args) => {
    const { execa } = await import('execa');
    return execa(...args);
};

module.exports = execa;
