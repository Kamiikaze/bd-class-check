# BD Class Check Action

A GitHub Action that automatically updates CSS class names based on BetterDiscord/Discord class changes and creates a pull request with the updates.

## Features

- 🔄 Fetches the latest class name changes from upstream
- 📝 Updates CSS files with new class names
- 🔍 Supports glob patterns and multiple files/directories
- 📊 Generates detailed PR with all changes
- ⏰ Can run on schedule or manually triggered
- 🎯 Zero configuration required for basic usage

## Usage

### Basic Example

```yaml
name: Update CSS Classes

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: your-username/bd-class-check@v1
        with:
          files: 'src/**/*.css'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Example

```yaml
name: Update CSS Classes

on:
  workflow_dispatch:
    inputs:
      files:
        description: 'Files to update'
        required: true
        default: 'src/**/*.css'

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: your-username/bd-class-check@v1
        with:
          files: ${{ github.event.inputs.files || 'src/**/*.css,styles/**/*.css' }}
          changes-url: 'https://raw.githubusercontent.com/SyndiShanX/Update-Classes/refs/heads/main/Changes.txt'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          branch-name: 'css-updates'
          pr-title: 'Update CSS classes'
          pr-labels: 'dependencies,automated,css'
          commit-message: 'chore: update CSS class names'
      
      - name: Check results
        if: steps.update.outputs.has-changes == 'true'
        run: |
          echo "Changes made: ${{ steps.update.outputs.total-changes }}"
          echo "Files modified: ${{ steps.update.outputs.modified-files }}"
          echo "PR number: ${{ steps.update.outputs.pr-number }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `files` | Comma-separated list of file paths or glob patterns | Yes | `src/**/*.css` |
| `changes-url` | URL to the Changes.txt file | No | `https://raw.githubusercontent.com/SyndiShanX/Update-Classes/refs/heads/main/Changes.txt` |
| `github-token` | GitHub token for creating PRs | Yes | `${{ github.token }}` |
| `branch-name` | Branch name for the PR | No | `css-class-updates` |
| `commit-message` | Commit message template | No | `chore: update CSS classes` |
| `pr-title` | Pull request title | No | `chore: Update CSS classes from upstream changes` |
| `pr-labels` | Comma-separated list of labels for the PR | No | `dependencies,automated` |

## Outputs

| Output | Description |
|--------|-------------|
| `has-changes` | Whether any changes were made (`true`/`false`) |
| `total-changes` | Total number of class changes made |
| `modified-files` | Number of files modified |
| `pr-number` | Pull request number (if created) |

## File Pattern Examples

- Single file: `src/style.css`
- Multiple files: `src/style.css,dist/theme.css`
- Glob pattern: `src/**/*.css`
- Multiple patterns: `src/**/*.css,styles/**/*.css,*.css`
- Directory: `src/` (will process all CSS files recursively)

## How It Works

1. Fetches the Changes.txt file from the specified URL
2. Parses the old → new class name mappings
3. Scans all specified CSS files for class references (`.className`)
4. Replaces old class names with new ones
5. Creates a detailed PR with:
   - Commit date of the Changes.txt file
   - Summary of total changes and files modified
   - Line-by-line breakdown of each change

## Example PR Output

```markdown
## CSS Class Updates

This PR updates CSS classes based on changes from the upstream Changes.txt file.

**Changes.txt last updated:** 2024-01-15T10:30:00Z

### Summary

**Total changes:** 42
**Files modified:** 3

### Modified Files

- src/DiscordPlus-source.theme.css
- src/components/chat.css
- src/components/sidebar.css

### Changes Detail

#### src/DiscordPlus-source.theme.css

- Line 15: `.chatContent_a7d72e` → `.chatContent_f2f89a`
- Line 23: `.message_d5deea` → `.message_c2g95b`
...
```

## Requirements

- Node.js 20
- Repository permissions: `contents: write` and `pull-requests: write`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
