#!/usr/bin/env python3
"""
ArXiv Paper Scraper for MonadBFT Research

Scrapes and processes research papers from arXiv, specifically focusing on
MonadBFT and related BFT consensus protocols.
"""

import os
import re
import json
import argparse
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import xml.etree.ElementTree as ET
from pathlib import Path


@dataclass
class ArxivPaper:
    """Data class for arXiv paper metadata"""
    paper_id: str
    title: str
    authors: List[str]
    abstract: str
    published: str
    updated: str
    pdf_url: str
    arxiv_url: str
    categories: List[str]
    doi: Optional[str] = None
    journal_ref: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class ArxivScraper:
    """Scraper for arXiv papers"""
    
    BASE_URL = "http://export.arxiv.org/api/query"
    MONADBFT_PAPER_ID = "2502.20692"
    
    def __init__(self, output_dir: str = "data/papers"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        
    def fetch_paper(self, paper_id: str) -> Optional[ArxivPaper]:
        """
        Fetch paper metadata from arXiv API
        
        Args:
            paper_id: arXiv paper ID (e.g., '2502.20692')
            
        Returns:
            ArxivPaper object or None if not found
        """
        # Clean paper ID
        paper_id = paper_id.replace('arxiv:', '').replace('arXiv:', '')
        
        params = {
            'id_list': paper_id,
            'max_results': 1
        }
        
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            
            return self._parse_response(response.text)
            
        except requests.RequestException as e:
            print(f"Error fetching paper {paper_id}: {e}")
            return None
    
    def _parse_response(self, xml_response: str) -> Optional[ArxivPaper]:
        """Parse arXiv API XML response"""
        try:
            root = ET.fromstring(xml_response)
            
            # Define namespace
            ns = {
                'atom': 'http://www.w3.org/2005/Atom',
                'arxiv': 'http://arxiv.org/schemas/atom'
            }
            
            entry = root.find('atom:entry', ns)
            if entry is None:
                return None
            
            # Extract paper ID from URL
            paper_url = entry.find('atom:id', ns).text
            paper_id = paper_url.split('/abs/')[-1]
            
            # Extract metadata
            title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
            abstract = entry.find('atom:summary', ns).text.strip()
            published = entry.find('atom:published', ns).text
            updated = entry.find('atom:updated', ns).text
            
            # Extract authors
            authors = []
            for author in entry.findall('atom:author', ns):
                name = author.find('atom:name', ns).text
                authors.append(name)
            
            # Extract categories
            categories = []
            for category in entry.findall('atom:category', ns):
                categories.append(category.get('term'))
            
            # Build URLs
            pdf_url = f"https://arxiv.org/pdf/{paper_id}.pdf"
            arxiv_url = f"https://arxiv.org/abs/{paper_id}"
            
            # Optional fields
            doi_elem = entry.find('arxiv:doi', ns)
            doi = doi_elem.text if doi_elem is not None else None
            
            journal_elem = entry.find('arxiv:journal_ref', ns)
            journal_ref = journal_elem.text if journal_elem is not None else None
            
            return ArxivPaper(
                paper_id=paper_id,
                title=title,
                authors=authors,
                abstract=abstract,
                published=published,
                updated=updated,
                pdf_url=pdf_url,
                arxiv_url=arxiv_url,
                categories=categories,
                doi=doi,
                journal_ref=journal_ref
            )
            
        except ET.ParseError as e:
            print(f"Error parsing XML response: {e}")
            return None
    
    def download_pdf(self, paper: ArxivPaper) -> Optional[Path]:
        """Download paper PDF"""
        try:
            response = self.session.get(paper.pdf_url, timeout=60)
            response.raise_for_status()
            
            pdf_path = self.output_dir / f"{paper.paper_id}.pdf"
            pdf_path.write_bytes(response.content)
            
            print(f"Downloaded PDF: {pdf_path}")
            return pdf_path
            
        except requests.RequestException as e:
            print(f"Error downloading PDF: {e}")
            return None
    
    def save_metadata(self, paper: ArxivPaper) -> Path:
        """Save paper metadata as JSON"""
        json_path = self.output_dir / f"{paper.paper_id}.json"
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(paper.to_dict(), f, indent=2, ensure_ascii=False)
        
        print(f"Saved metadata: {json_path}")
        return json_path
    
    def search_papers(self, query: str, max_results: int = 10) -> List[ArxivPaper]:
        """
        Search papers on arXiv
        
        Args:
            query: Search query (e.g., 'BFT consensus')
            max_results: Maximum number of results to return
            
        Returns:
            List of ArxivPaper objects
        """
        params = {
            'search_query': query,
            'max_results': max_results,
            'sortBy': 'relevance',
            'sortOrder': 'descending'
        }
        
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            
            papers = []
            root = ET.fromstring(response.text)
            
            ns = {
                'atom': 'http://www.w3.org/2005/Atom',
                'arxiv': 'http://arxiv.org/schemas/atom'
            }
            
            for entry in root.findall('atom:entry', ns):
                # Parse each entry (similar to _parse_response)
                paper_url = entry.find('atom:id', ns).text
                paper_id = paper_url.split('/abs/')[-1]
                
                title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
                abstract = entry.find('atom:summary', ns).text.strip()
                published = entry.find('atom:published', ns).text
                updated = entry.find('atom:updated', ns).text
                
                authors = [author.find('atom:name', ns).text 
                          for author in entry.findall('atom:author', ns)]
                
                categories = [cat.get('term') 
                            for cat in entry.findall('atom:category', ns)]
                
                papers.append(ArxivPaper(
                    paper_id=paper_id,
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    published=published,
                    updated=updated,
                    pdf_url=f"https://arxiv.org/pdf/{paper_id}.pdf",
                    arxiv_url=f"https://arxiv.org/abs/{paper_id}",
                    categories=categories
                ))
            
            return papers
            
        except Exception as e:
            print(f"Error searching papers: {e}")
            return []
    
    def fetch_monadbft_paper(self) -> Optional[ArxivPaper]:
        """Fetch the main MonadBFT paper"""
        print(f"Fetching MonadBFT paper: {self.MONADBFT_PAPER_ID}")
        return self.fetch_paper(self.MONADBFT_PAPER_ID)
    
    def fetch_related_papers(self) -> List[ArxivPaper]:
        """Fetch papers related to MonadBFT"""
        queries = [
            "HotStuff BFT consensus",
            "Fast-HotStuff",
            "Byzantine fault tolerance blockchain",
            "streamlined consensus"
        ]
        
        all_papers = []
        for query in queries:
            print(f"Searching: {query}")
            papers = self.search_papers(query, max_results=5)
            all_papers.extend(papers)
        
        # Remove duplicates
        seen = set()
        unique_papers = []
        for paper in all_papers:
            if paper.paper_id not in seen:
                seen.add(paper.paper_id)
                unique_papers.append(paper)
        
        return unique_papers


def main():
    parser = argparse.ArgumentParser(
        description="Scrape arXiv papers for MonadBFT research"
    )
    parser.add_argument(
        '--paper-id',
        default='2502.20692',
        help='ArXiv paper ID to fetch (default: 2502.20692)'
    )
    parser.add_argument(
        '--download-pdf',
        action='store_true',
        help='Download PDF file'
    )
    parser.add_argument(
        '--search',
        help='Search query for related papers'
    )
    parser.add_argument(
        '--fetch-related',
        action='store_true',
        help='Fetch related BFT papers'
    )
    parser.add_argument(
        '--output-dir',
        default='data/papers',
        help='Output directory for downloaded files'
    )
    
    args = parser.parse_args()
    
    scraper = ArxivScraper(output_dir=args.output_dir)
    
    if args.search:
        # Search mode
        print(f"Searching for: {args.search}")
        papers = scraper.search_papers(args.search, max_results=10)
        
        for i, paper in enumerate(papers, 1):
            print(f"\n{i}. {paper.title}")
            print(f"   Authors: {', '.join(paper.authors[:3])}{'...' if len(paper.authors) > 3 else ''}")
            print(f"   Published: {paper.published}")
            print(f"   URL: {paper.arxiv_url}")
            
            scraper.save_metadata(paper)
    
    elif args.fetch_related:
        # Fetch related papers
        print("Fetching related BFT consensus papers...")
        papers = scraper.fetch_related_papers()
        
        print(f"\nFound {len(papers)} related papers")
        for paper in papers:
            scraper.save_metadata(paper)
            if args.download_pdf:
                scraper.download_pdf(paper)
    
    else:
        # Fetch specific paper
        paper = scraper.fetch_paper(args.paper_id)
        
        if paper:
            print(f"\nTitle: {paper.title}")
            print(f"Authors: {', '.join(paper.authors)}")
            print(f"Published: {paper.published}")
            print(f"\nAbstract:\n{paper.abstract}")
            print(f"\nURL: {paper.arxiv_url}")
            print(f"PDF: {paper.pdf_url}")
            
            # Save metadata
            scraper.save_metadata(paper)
            
            # Download PDF if requested
            if args.download_pdf:
                scraper.download_pdf(paper)
        else:
            print(f"Paper {args.paper_id} not found")


if __name__ == '__main__':
    main()
