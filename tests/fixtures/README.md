# Test fixtures

## Files

| File                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `test-document.pdf`       | Clean file used for successful upload tests              |
| `test-document.txt`       | Clean text file used for upload tests                    |
| `test-virus-document.pdf` | Triggers the INFECTED scan path in the cdp-uploader mock |

### Why do the two PDF files have identical content?

`test-virus-document.pdf` and `test-document.pdf` have the same bytes by design.

In the test environment, `cdp-uploader` runs with `MOCK_VIRUS_SCAN_ENABLED=true`. Its mock virus
scanner (`mock-virus-scanner.js`) reads the `encodedfilename` S3 metadata stored at upload time
and tests it against the regex `.*virus.*` (configurable via `MOCK_VIRUS_REGEX`). **File content
is never read.** A file is flagged as INFECTED if and only if its original filename matches the
regex.

Because virus detection is filename-driven, using identical PDF content for both fixtures is
correct. Replacing the content with an EICAR string would have no effect.
