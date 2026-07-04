// Example usage of the protected API route with JWT authentication

interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
  timestamp: string;
}

interface DataResponse extends AuthResponse {
  data?: any;
}

/**
 * Fetch data from protected route with JWT token
 */
export async function fetchProtectedData(token: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/protected', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch protected data:', error);
    throw error;
  }
}

/**
 * Post data to protected route with JWT token
 */
export async function postProtectedData(
  token: string,
  data: any
): Promise<DataResponse> {
  try {
    const response = await fetch('/api/protected', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to post protected data:', error);
    throw error;
  }
}

/**
 * Example usage in a React component
 */
export function ProtectedDataExample() {
  const [data, setData] = React.useState<AuthResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const result = await fetchProtectedData(token);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleFetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Protected Data'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
