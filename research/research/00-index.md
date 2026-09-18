# Repository Research Index

This directory contains technical analysis of external scraping repositories to extract architectural patterns, techniques, and lessons for the Jaydr Scraper project.

## Purpose

We study existing scraper implementations to:
- Understand common architectural patterns and trade-offs
- Learn from others' approaches to scraping challenges
- Identify best practices and anti-patterns
- Extract techniques that align with our project principles
- Build a knowledge base for informed decision-making

## Analysis Framework

See [01-methodology.md](01-methodology.md) for our analysis framework, criteria, and approach.

## Studied Repositories

| Repository | Status | Focus Area | Last Updated |
|---|---|---|---|
| comalex/aliexpress_parser | Complete | AliExpress product parser | 2026-08-25 |
| sudheer-ranga/aliexpress-product-scraper | Complete | Product scraping (npm package) | 2026-08-25 |
| smicallef/spiderfoot | Complete | Event-driven multi-source OSINT & ingestion | 2026-08-27 |
| stiekel/aliexpress | Not started | General AliExpress scraping | - |
| agabopinho/AliExpressScraper | Not started | Scraper implementation | - |
| DongshaoZ/aliexpress | Not started | AliExpress tools | - |
| yohaybn/HA_aliexpress_package_tracker_sensor | Not started | Package tracking | - |
| theimperium20/Aliexpress-Review-Crawler | Not started | Review crawling | - |
| moh3a/ae_sdk | Not started | SDK/Wrapper | - |

## Repository Analysis Structure

Each repository gets its own folder with the following structure:

```
research/{repo-name}/
├── README.md           # Overview and quick summary
├── architecture.md     # Technical architecture analysis
├── techniques.md       # Scraping techniques used
├── security.md         # Security and anti-bot approach
└── lessons.md         # Applicable lessons for our project
```

## Key Principles

1. **Learning, not copying**: We study to understand patterns, not to copy code
2. **Principle-aligned**: We filter techniques through our project's ethical and technical principles
3. **Critical analysis**: We identify both good patterns and anti-patterns
4. **Documentation focus**: Emphasis on understanding over implementation
5. **Hybrid approach**: Download promising repos for deep analysis, review others on GitHub

## Comparative Analysis

See [comparative-analysis.md](comparative-analysis.md) for cross-repository patterns and insights.

## Cybersecurity Research

See [cybersecurity-evasion-research.md](cybersecurity-evasion-research.md) for academic analysis of evasion techniques (User-Agent spoofing, stealth plugins) for defensive cybersecurity research purposes.

## Integration with Main Project

Key insights from this research will be integrated into the main wiki when they:
- Provide validated architectural patterns
- Offer solutions to challenges we've identified
- Align with our project principles and constraints
- Have practical applicability to our use cases