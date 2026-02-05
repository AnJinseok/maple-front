import { useEffect, useState } from "react";

/**
 * 비동기 fetcher를 실행하고 data/loading/error를 관리하는 훅
 * - 입력: fetcher(function: Promise 반환), deps(array)
 * - 출력: { data, loading, error }
 */
export function useFetch(fetcher, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // fetch 시작 시 로딩/에러 초기화
        setLoading(true);
        fetcher()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, deps);

    return { data, loading, error };
}
