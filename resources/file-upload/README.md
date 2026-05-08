# Test fixtures

| File                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `test-document.pdf`       | Clean file used for upload tests                         |
| `test-document.txt`       | Clean text file used for upload tests                    |
| `test-virus-document.pdf` | Triggers the INFECTED scan path in the cdp-uploader mock |

`test-virus-document.pdf` shares its bytes with `test-document.pdf` by design: cdp-uploader's
mock scanner flags by filename, not content. Renaming the fixture to match the configured
regex is what triggers the INFECTED result.
