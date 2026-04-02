// FETCH CUSTOM OFFLINE TEXT MULA SA ADMIN PANEL AT CHANNEL SPECIFIC MESSAGE
  const [offlineText, setOfflineText] = useState({
    title: channel.offlineTitle || "Channel is currently offline.",
    message: channel.offlineMessage || "Please try another channel or use a backup link."
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOfflineText = async () => {
      // KUNG WALANG SPECIFIC MESSAGE YUNG CHANNEL, KUKUHA SIYA SA GLOBAL SETTINGS
      if (!channel.offlineTitle && !channel.offlineMessage) {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'iptv_config').maybeSingle();
        if (isMounted && data?.value) {
          const conf = data.value as any;
          setOfflineText({
            title: conf.offline_title || "Channel is currently offline.",
            message: conf.offline_message || "Please try another channel or use a backup link."
          });
        }
      }
    };
    fetchOfflineText();
    return () => { isMounted = false; };
  }, [channel]);
