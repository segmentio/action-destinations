# Pre-Commit Hook

This pre-commit hook runs [Gitleaks](https://github.com/zricethezav/gitleaks) to check the commit for any secrets that might have been included in it.

The hook will install gitleaks using brew if it is not already installed.

The hook currently is built to run on MacOS and will exit with an error message on other platforms. Non-MacOS Users will have to independently install gitleaks to run the hook.

## False Positives

The hook is configured to only use the rules specified in the [pre-defined gitleaks rules](https://github.com/zricethezav/gitleaks/blob/master/config/gitleaks.toml) and our custom rules configuration in `.husky/gitleaks-rules.toml`. For the most part these rules rely on regexes to match secrets and aren't prone to false positives. However if the hook stops a commit on a false positive, users can use `git commit --no-verify` to disable the hook.

## Configuration

The hook uses the `.husky/gitleaks-rules.toml` file to add additional matching regexes to the [pre-defined gitleaks rules](https://github.com/zricethezav/gitleaks/blob/master/config/gitleaks.toml). If a token that is not included on this pre-defined list is accidentally included in a commit, we should write a new regex matching that token to the `gitleaks-rules.toml` file so it will be flagged in the future.

The `.husky/gitleaks-rules.toml` file includes an allowlist where we can specify files that should not be scanned for secrets.
