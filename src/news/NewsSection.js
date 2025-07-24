import React, { useEffect, useState } from 'react';

function NewsSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bulk-rss-articles/')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch articles:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading news...</div>;

  return (
    <div>
      <h2>Latest Market News</h2>
      {articles.length === 0 && <div>No news available.</div>}
      <ul>
        {articles.map((article, idx) => (
          <li key={idx}>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <strong>{article.title}</strong>
            </a>
            <div>{article.summary}</div>
            <div><em>{article.source}</em></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NewsSection;