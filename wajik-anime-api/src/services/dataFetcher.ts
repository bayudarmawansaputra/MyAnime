import axios, { type AxiosResponse, type AxiosRequestConfig } from "axios";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

export async function wajikFetch(
  url: string,
  axiosConfig?: AxiosRequestConfig<any>,
  callback?: (response: AxiosResponse) => void
): Promise<any> {
  const response = await axios({
    url,
    headers: {
      ...axiosConfig?.headers,
      "User-Agent": userAgent,
    },
    ...axiosConfig,
  });

  if (callback) callback(response);

  const data = response.data;

  return data;
}

export async function getFinalUrl(url: string, axiosConfig?: AxiosRequestConfig<any>): Promise<any> {
  const response = await axios.head(url, {
    ...axiosConfig,
    headers: {
      ...axiosConfig?.headers,
      "User-Agent": userAgent,
    },
    maxRedirects: 0,
    validateStatus: function (status) {
      return status >= 200 && status < 400;
    },
  });

  const location = response.headers["location"];

  if (location) return location;

  return url;
}

export async function getFinalUrls(
  urls: string[],
  config: {
    axiosConfig?: AxiosRequestConfig<any>;
    retryConfig?: {
      retries?: number;
      delay?: number;
    };
  }
): Promise<any[]> {
  const { retries = 3, delay = 1000 } = config.retryConfig || {};

  const retryRequest = async (url: string): Promise<any> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await getFinalUrl(url, config.axiosConfig);
      } catch (error) {
        if (attempt === retries) throw error;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const requests = urls.map((url) => retryRequest(url));
  const responses = await Promise.allSettled(requests);

  const results = responses.map((response) => {
    if (response.status === "fulfilled") return response.value;

    return "";
  });

  return results;
}
