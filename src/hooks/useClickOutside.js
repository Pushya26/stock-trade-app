import { useEffect } from "react";

export function useClickOutside(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener("click", handleClickOutside); // 👈 use 'click'
    return () => document.removeEventListener("click", handleClickOutside);
  }, [ref, callback]);
}
