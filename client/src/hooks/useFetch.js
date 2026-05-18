import { useState, useEffect, useCallback } from 'react';
import api from '../api';

/**
 * Generic fetch hook — handles loading, error, and data state
 * Usage: const { data, loading, error, refetch } = useFetch('/students')
 */
const useFetch = (endpoint, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (immediate) fetch();
  }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
};

export default useFetch;
