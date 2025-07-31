export const safeJsonParse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      const text = await response.text();
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } else {
    const text = await response.text();
    throw new Error(`Server returned non-JSON response: ${text}`);
  }
};