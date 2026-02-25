#!/usr/bin/env python3
"""
Category Labs Blog Scraper

Scrapes blog posts from Category Labs and other Monad-related sources.
"""

import os
import json
import argparse
import requests
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Please install beautifulsoup4: pip install beautifulsoup4")
    exit(1)


@dataclass
class BlogPost:
    """Data class for blog post metadata"""
    url: str
    title: str
    author: Optional[str]
    published: Optional[str]
    content: str
    excerpt: str
    tags: List[str]
    source: str
    
    def to_dict(self) -> Dict:
        return asdict(self)


class BlogScraper:
    """Scraper for Monad and BFT-related blog posts"""
    
    SOURCES = {
        'category_labs': 'https://blog.categorylabs.xyz',
        'monad': 'https://www.monad.xyz/blog',
    }
    
    def __init__(self, output_dir: str = "data/blog_posts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; MonadBFT-Research/1.0)'
        })
    
    def scrape_category_labs(self) -> List[BlogPost]:
        """
        Scrape blog posts from Category Labs
        
        Note: This is a placeholder implementation.
        Actual implementation would need to match the site's structure.
        """
        posts = []
        base_url = self.SOURCES['category_labs']
        
        try:
            response = self.session.get(base_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Example scraping logic (adjust based on actual site structure)
            articles = soup.find_all('article', class_='post')
            
            for article in articles:
                try:
                    title_elem = article.find('h2') or article.find('h1')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    
                    # Get post URL
                    link_elem = article.find('a', href=True)
                    post_url = urljoin(base_url, link_elem['href']) if link_elem else base_url
                    
                    # Get excerpt
                    excerpt_elem = article.find('p')
                    excerpt = excerpt_elem.get_text(strip=True) if excerpt_elem else ''
                    
                    # Get metadata
                    author = self._extract_author(article)
                    published = self._extract_date(article)
                    tags = self._extract_tags(article)
                    
                    # Fetch full content
                    content = self._fetch_post_content(post_url)
                    
                    post = BlogPost(
                        url=post_url,
                        title=title,
                        author=author,
                        published=published,
                        content=content,
                        excerpt=excerpt[:500],
                        tags=tags,
                        source='category_labs'
                    )
                    posts.append(post)
                    
                    # Be respectful - rate limit
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"Error parsing article: {e}")
                    continue
            
        except requests.RequestException as e:
            print(f"Error fetching Category Labs blog: {e}")
        
        return posts
    
    def _fetch_post_content(self, url: str) -> str:
        """Fetch full content of a blog post"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for main content (adjust selectors as needed)
            content_elem = (
                soup.find('article') or 
                soup.find('div', class_='content') or
                soup.find('div', class_='post-content')
            )
            
            if content_elem:
                # Remove script and style elements
                for script in content_elem(["script", "style"]):
                    script.decompose()
                
                return content_elem.get_text(separator='\n', strip=True)
            
            return ''
            
        except Exception as e:
            print(f"Error fetching post content from {url}: {e}")
            return ''
    
    def _extract_author(self, element) -> Optional[str]:
        """Extract author from HTML element"""
        author_elem = (
            element.find(class_='author') or
            element.find('span', class_='by') or
            element.find('a', rel='author')
        )
        return author_elem.get_text(strip=True) if author_elem else None
    
    def _extract_date(self, element) -> Optional[str]:
        """Extract publication date from HTML element"""
        date_elem = (
            element.find('time') or
            element.find(class_='date') or
            element.find(class_='published')
        )
        
        if date_elem:
            # Try to get datetime attribute first
            date_str = date_elem.get('datetime', date_elem.get_text(strip=True))
            return date_str
        
        return None
    
    def _extract_tags(self, element) -> List[str]:
        """Extract tags from HTML element"""
        tags = []
        
        # Look for tag containers
        tag_container = (
            element.find(class_='tags') or
            element.find(class_='categories')
        )
        
        if tag_container:
            tag_elems = tag_container.find_all('a')
            tags = [tag.get_text(strip=True) for tag in tag_elems]
        
        return tags
    
    def save_post(self, post: BlogPost) -> Path:
        """Save blog post as JSON"""
        # Create filename from URL
        filename = urlparse(post.url).path.strip('/').replace('/', '_')
        if not filename:
            filename = post.title.lower().replace(' ', '_')[:50]
        
        filename = f"{filename}.json"
        filepath = self.output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(post.to_dict(), f, indent=2, ensure_ascii=False)
        
        print(f"Saved: {filepath}")
        return filepath
    
    def scrape_all_sources(self) -> List[BlogPost]:
        """Scrape all configured sources"""
        all_posts = []
        
        print("Scraping Category Labs blog...")
        posts = self.scrape_category_labs()
        all_posts.extend(posts)
        
        return all_posts
    
    def filter_monadbft_posts(self, posts: List[BlogPost]) -> List[BlogPost]:
        """Filter posts related to MonadBFT"""
        keywords = [
            'monadbft', 'hotstuff', 'bft', 'consensus',
            'byzantine', 'finality', 'fork', 'blockchain'
        ]
        
        filtered = []
        for post in posts:
            text = f"{post.title} {post.content} {' '.join(post.tags)}".lower()
            if any(keyword in text for keyword in keywords):
                filtered.append(post)
        
        return filtered


def main():
    parser = argparse.ArgumentParser(
        description="Scrape blog posts for MonadBFT research"
    )
    parser.add_argument(
        '--source',
        choices=['category_labs', 'monad', 'all'],
        default='all',
        help='Blog source to scrape'
    )
    parser.add_argument(
        '--filter-monadbft',
        action='store_true',
        help='Only save posts related to MonadBFT'
    )
    parser.add_argument(
        '--output-dir',
        default='data/blog_posts',
        help='Output directory'
    )
    
    args = parser.parse_args()
    
    scraper = BlogScraper(output_dir=args.output_dir)
    
    if args.source == 'all':
        posts = scraper.scrape_all_sources()
    elif args.source == 'category_labs':
        posts = scraper.scrape_category_labs()
    else:
        print(f"Source {args.source} not yet implemented")
        return
    
    if args.filter_monadbft:
        posts = scraper.filter_monadbft_posts(posts)
    
    print(f"\nFound {len(posts)} blog posts")
    
    for post in posts:
        scraper.save_post(post)
        print(f"  - {post.title}")


if __name__ == '__main__':
    main()
