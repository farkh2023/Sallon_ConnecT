const fs = require('fs');
const path = require('path');

describe('security regressions', () => {
  it('service worker refuses sensitive cache paths and keeps offline fallback', () => {
    const sw = fs.readFileSync(path.resolve('frontend/public/sw.js'), 'utf8');

    expect(sw).toContain('/api/');
    expect(sw).toContain('/runtime');
    expect(sw).toContain('/smartthings');
    expect(sw).toContain('/adb');
    expect(sw).toContain('/dlna');
    expect(sw).toContain('/streaming');
    expect(sw).toContain('/scheduler');
    expect(sw).toContain("caches.match('/offline')");
    expect(sw).toContain("cache: 'no-store'");
  });

  it('does not version runtime JSON or logs by default', () => {
    const gitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
    expect(gitignore).toMatch(/runtime\/\*\.json/);
    expect(gitignore).toMatch(/logs\/\*\.log/);
    expect(gitignore).toMatch(/logs\/\*\.txt/);
  });
});
