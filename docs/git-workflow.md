# Git Workflow Guidelines

## Handling Merge Conflicts

Merge conflicts happen when Git cannot automatically merge changes from different branches. This usually occurs when multiple developers modify the same part of a file.

### How to Resolve Merge Conflicts

1. **Identify the conflicted files**

   ```bash
   git status
   ```

2. **Open each conflicted file and look for conflict markers**

   Conflict markers look like this:
   ```
   <<<<<<< HEAD
   // Code from the current branch
   =======
   // Code from the branch being merged
   >>>>>>> branch-name
   ```

3. **Edit the file to resolve the conflict**

   - Remove all conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> branch-name`)
   - Keep the code you want to retain
   - Make sure the final code is syntactically correct

4. **After resolving all conflicts, mark them as resolved**

   ```bash
   git add <resolved-file>
   ```

5. **Complete the merge**

   ```bash
   git commit -m "Resolved merge conflicts"
   ```

## Preventing Merge Conflicts

- Pull changes frequently from the main branch
- Communicate with team members when working on the same files
- Consider using feature flags for significant changes
- Break down large changes into smaller, more manageable pull requests
