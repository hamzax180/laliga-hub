const axios = require('axios');

const getSmartImage = (title, category) => 'https://via.placeholder.com/800x450';

const fetchRSSNews = async () => {
    try {
        console.log('Testing live news fetch...');

        const bbcResponse = await axios.get('https://feeds.bbci.co.uk/sport/football/spanish-la-liga/rss.xml', {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const googleResponse = await axios.get('https://news.google.com/rss/search?q=La+Liga+Football&hl=en-GB&gl=GB&ceid=GB:en', {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const parseRSS = (xml, sourceName) => {
            const items = xml.split('<item>').slice(1, 4);
            return items.map((item, index) => {
                const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
                const title = titleMatch ? titleMatch[1].replace('BBC Sport - ', '').trim() : 'La Liga Update';
                const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
                const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
                return { title, date, source: sourceName };
            });
        };

        const bbcNews = parseRSS(bbcResponse.data, 'BBC Sport');
        const googleNews = parseRSS(googleResponse.data, 'Google News');

        const combined = [...bbcNews, ...googleNews];
        console.log('Results:', JSON.stringify(combined, null, 2));
    } catch (error) {
        console.error('Fetch Failed:', error.message);
    }
};

fetchRSSNews();
