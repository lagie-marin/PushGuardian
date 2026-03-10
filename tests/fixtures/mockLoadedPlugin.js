class MockLoadedPlugin {
    constructor(manifest) {
        this.name = manifest.name;
        this.version = manifest.version || '0.0.0';
        this.description = manifest.description || '';
        this.enabled = true;
        this.commands = new Map();
    }
}

module.exports = MockLoadedPlugin;
