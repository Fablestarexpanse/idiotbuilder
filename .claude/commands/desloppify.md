# /desloppify

Run the desloppify code quality scanner on the Idiotbuilder project.

## Usage

```
/desloppify          — full scan, show scorecard
/desloppify fix      — get the top priority fix suggestion
/desloppify next     — get the next issue to address
```

## Steps

1. Run the scan:
   ```
   python -m desloppify scan --path .
   ```

2. Show the score summary from the output.

3. If the user typed `fix` or `next`, run:
   ```
   python -m desloppify next
   ```
   and present the top issue with the file path, description, and suggested fix.

4. After any fixes, re-run the scan to confirm the score improved.

## Notes

- Target score: 80+ (current baseline ~17, mainly penalised for missing tests)
- The scan saves `scorecard.png` in the project root
- Config lives in `.desloppify/` (git-ignored)
- Run `python -m desloppify update-skill claude` if the skill definition ever needs refreshing
