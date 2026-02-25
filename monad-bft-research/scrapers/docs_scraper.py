#!/usr/bin/env python3
"""
Official Documentation Scraper

Scrapes official Monad documentation from docs.monad.xyz
"""

import os
import json
import argparse
import requests
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Please install beautifulsoup4: pip install beautifulsoup4")
    exit(1)


@dataclass
class DocPage:
    """Data class for documentation page"""
    url: str
    title: str
    content: str
    section: str
    subsection: Optional[str]
    breadcrumbs: List[str]
    
    def to_dict(self) -> Dict:
        return asdict(self)


class DocsScraper:
    """Scraper for Monad official documentation"""
    
    BASE_URL = "https://docs.monad.xyz"
    
    def __init__(self, output_dir: str = "data/docs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; MonadBFT-Research/1.0)'
        })
        self.visited_urls = set()
    
    def scrape_docs(self, start_url: Optional[str] = None) -> List[DocPage]:
        """
        Scrape documentation pages
        
        Args:
            start_url: Starting URL (defaults to BASE_URL)
            
        Returns:
            List of DocPage objects
        """
        if start_url is None:
            start_url = self.BASE_URL
        
        pages = []
        urls_to_visit = [start_url]
        
        while urls_to_visit:
            url = urls_to_visit.pop(0)
            
            if url in self.visited_urls:
                continue
            
            print(f"Scraping: {url}")
            page = self._scrape_page(url)
            
            if page:
                pages.append(page)
                self.visited_urls.add(url)
                
                # Find links to other doc pages
                new_urls = self._find_doc_links(url)
                urls_to_visit.extend(new_urls)
            
            # Rate limiting
            time.sleep(1)
        
        return pages
    
    def _scrape_page(self, url: str) -> Optional[DocPage]:
        """Scrape a single documentation page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text(strip=True) if title_elem else 'Untitled'
            
            # Extract main content
            content_elem = (
                soup.find('main') or
                soup.find('article') or
                soup.find(class_='documentation-content') or
                soup.find(class_='doc-content')
            )
            
            if content_elem:
                # Remove navigation and script elements
                for elem in content_elem(["script", "style", "nav"]):
                    elem.decompose()
                
                content = content_elem.get_text(separator='\n', strip=True)
            else:
                content = ''
            
            # Extract breadcrumbs
            breadcrumbs = self._extract_breadcrumbs(soup)
            
            # Determine section and subsection
            section = breadcrumbs[0] if breadcrumbs else 'General'
            subsection = breadcrumbs[1] if len(breadcrumbs) > 1 else None
            
            return DocPage(
                url=url,
                title=title,
                content=content,
                section=section,
                subsection=subsection,
                breadcrumbs=breadcrumbs
            )
            
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None
    
    def _extract_breadcrumbs(self, soup) -> List[str]:
        """Extract breadcrumb navigation"""
        breadcrumbs = []
        
        breadcrumb_elem = (
            soup.find('nav', class_='breadcrumbs') or
            soup.find('ol', class_='breadcrumb') or
            soup.find(class_='breadcrumb')
        )
        
        if breadcrumb_elem:
            links = breadcrumb_elem.find_all('a')
            breadcrumbs = [link.get_text(strip=True) for link in links]
        
        return breadcrumbs
    
    def _find_doc_links(self, url: str) -> List[str]:
        """Find links to other documentation pages"""
        links = []
        
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all links within the same domain
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)
                
                # Only include links to the same domain
                if urlparse(full_url).netloc == urlparse(self.BASE_URL).netloc:
                    # Exclude anchors and already visited
                    if '#' not in full_url and full_url not in self.visited_urls:
                        links.append(full_url)
            
        except Exception as e:
            print(f"Error finding links in {url}: {e}")
        
        return links
    
    def save_page(self, page: DocPage) -> Path:
        """Save documentation page as JSON"""
        # Create filename from URL path
        path = urlparse(page.url).path.strip('/').replace('/', '_')
        if not path:
            path = 'index'
        
        filename = f"{path}.json"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(page.to_dict(), f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def save_all_pages(self, pages: List[DocPage]):
        """Save all pages and create an index"""
        print(f"\nSaving {len(pages)} documentation pages...")
        
        for page in pages:
            self.save_page(page)
        
        # Create index
        index = {
            'total_pages': len(pages),
            'sections': {},
            'pages': []
        }
        
        for page in pages:
            # Group by section
            if page.section not in index['sections']:
                index['sections'][page.section] = []
            
            index['sections'][page.section].append({
                'title': page.title,
                'url': page.url,
                'subsection': page.subsection
            })
            
            # Add to pages list
            index['pages'].append({
                'title': page.title,
                'url': page.url,
                'section': page.section
            })
        
        # Save index
        index_path = self.output_dir / 'index.json'
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        print(f"Saved index: {index_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Monad documentation"
    )
    parser.add_argument(
        '--url',
        default='https://docs.monad.xyz',
        help='Starting URL for documentation'
    )
    parser.add_argument(
        '--output-dir',
        default='data/docs',
        help='Output directory'
    )
    parser.add_argument(
        '--single-page',
        action='store_true',
        help='Only scrape the specified URL (no recursion)'
    )
    
    args = parser.parse_args()
    
    scraper = DocsScraper(output_dir=args.output_dir)
    
    if args.single_page:
        page = scraper._scrape_page(args.url)
        if page:
            scraper.save_page(page)
            print(f"\nSaved: {page.title}")
    else:
        pages = scraper.scrape_docs(start_url=args.url)
        scraper.save_all_pages(pages)
        
        print(f"\nScraped {len(pages)} pages:")
        for page in pages:
            print(f"  - {page.title} ({page.section})")


if __name__ == '__main__':
    main()
