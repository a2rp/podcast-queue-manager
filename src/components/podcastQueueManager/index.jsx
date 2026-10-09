import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiChevronUp, FiClock, FiPause, FiPlay, FiPlus, FiSkipForward, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog/index.jsx";
import styles from "./styles.module.css";

const starterQueue = [
    { id: 1, show: "The Daily", title: "The hidden life of a city tree", host: "Michael Barbaro", minutes: 34, elapsed: 12, played: false, tint: "clay" },
    { id: 2, show: "99% Invisible", title: "The sound of the familiar", host: "Roman Mars", minutes: 28, elapsed: 0, played: false, tint: "green" },
    { id: 3, show: "The Kitchen Sisters Present", title: "A recipe that traveled", host: "Davia Nelson", minutes: 42, elapsed: 0, played: false, tint: "gold" },
    { id: 4, show: "Search Engine", title: "What happens to old maps?", host: "PJ Vogt", minutes: 39, elapsed: 0, played: false, tint: "blue" },
];
const key = "earspace-listening-queue";
const formatTime = (seconds) => Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");

const PodcastQueueManager = () => {
    const [queue, setQueue] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? starterQueue; } catch { return starterQueue; } });
    const [activeId, setActiveId] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Up next");
    const [newShow, setNewShow] = useState("");
    const [newEpisode, setNewEpisode] = useState("");
    const [removing, setRemoving] = useState(null);
    useEffect(() => localStorage.setItem(key, JSON.stringify(queue)), [queue]);
    const activeEpisode = queue.find((episode) => episode.id === activeId) ?? queue.find((episode) => !episode.played) ?? null;
    const visibleQueue = useMemo(() => queue.filter((episode) => (filter === "History" ? episode.played : !episode.played) && (episode.show + " " + episode.title + " " + episode.host).toLowerCase().includes(search.toLowerCase())), [queue, filter, search]);
    useEffect(() => {
        if (!playing || !activeEpisode) return undefined;
        const timer = window.setInterval(() => {
            setQueue((current) => current.map((episode) => {
                if (episode.id !== activeEpisode.id) return episode;
                const elapsed = episode.elapsed + 1;
                if (elapsed >= episode.minutes * 60) { setPlaying(false); return { ...episode, elapsed: 0, played: true }; }
                return { ...episode, elapsed };
            }));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [playing, activeEpisode]);
    const togglePlay = () => { if (!activeEpisode) return; setActiveId(activeEpisode.id); setPlaying((value) => !value); };
    const markPlayed = () => { if (!activeEpisode) return; setQueue((current) => current.map((episode) => episode.id === activeEpisode.id ? { ...episode, played: true, elapsed: episode.minutes * 60 } : episode)); setPlaying(false); const next = queue.find((episode) => !episode.played && episode.id !== activeEpisode.id); if (next) setActiveId(next.id); };
    const addEpisode = (event) => { event.preventDefault(); const show = newShow.trim(); const title = newEpisode.trim(); if (!show || !title) return; const episode = { id: Date.now(), show, title, host: "Saved by you", minutes: 30, elapsed: 0, played: false, tint: "violet" }; setQueue((current) => [...current, episode]); setNewShow(""); setNewEpisode(""); };
    const moveEpisode = (id, offset) => setQueue((current) => { const subset = current.filter((episode) => !episode.played); const index = subset.findIndex((episode) => episode.id === id); const target = index + offset; if (index < 0 || target < 0 || target >= subset.length) return current; const [moved] = subset.splice(index, 1); subset.splice(target, 0, moved); let next = -1; return current.map((episode) => episode.played ? episode : subset[++next]); });
    const deleteEpisode = () => { setQueue((current) => current.filter((episode) => episode.id !== removing.id)); if (activeId === removing.id) { setPlaying(false); setActiveId(queue.find((episode) => !episode.played && episode.id !== removing.id)?.id ?? null); } setRemoving(null); };
    const nextEpisode = () => { const remaining = queue.filter((episode) => !episode.played && episode.id !== activeEpisode?.id); if (remaining[0]) { setActiveId(remaining[0].id); setPlaying(false); } };
    const remainingTime = activeEpisode ? activeEpisode.minutes * 60 - activeEpisode.elapsed : 0;

    return <div className={styles.page}>
        <section className={styles.heading} id="now-playing"><div><p className={styles.label}>A queue for the in-between</p><h1>Keep listening.</h1><p>Save your place, line up the next story, and take your time.</p></div><div className={styles.clock}><FiClock aria-hidden="true" /><span>{queue.filter((episode) => !episode.played).length} episodes waiting</span></div></section>
        <section className={styles.playerCard}><div className={styles.waveArt + " " + styles[activeEpisode?.tint ?? "clay"]} aria-hidden="true"><span>EAR<br />SPACE</span><i /><b /></div><div className={styles.currentDetails}><span>NOW PLAYING</span><h2>{activeEpisode?.title ?? "Your queue is clear"}</h2><p>{activeEpisode?.show ?? "Add an episode below"}{activeEpisode ? " · " + activeEpisode.host : ""}</p><div className={styles.scrubber}><span style={{ width: activeEpisode ? activeEpisode.elapsed / (activeEpisode.minutes * 60) * 100 + "%" : "0%" }} /></div><div className={styles.timeLabels}><span>{formatTime(activeEpisode?.elapsed ?? 0)}</span><span>-{formatTime(remainingTime)}</span></div></div><div className={styles.playerControls}><button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? "Pause playback" : "Start playback"}>{playing ? <FiPause /> : <FiPlay />}</button><button type="button" className={styles.nextButton} onClick={nextEpisode} aria-label="Play next episode"><FiSkipForward /></button><button type="button" className={styles.markPlayed} onClick={markPlayed} disabled={!activeEpisode}><FiCheck /> Finished</button></div></section>
        <section className={styles.queuePanel} id="queue"><div className={styles.queueHead}><div><h2>Listening queue</h2><p>Move episodes around to decide what comes next.</p></div><label className={styles.search}><FiClock aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search episodes" aria-label="Search episodes" /></label></div>
            <div className={styles.queueTabs} role="group" aria-label="Queue view">{["Up next", "History"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={filter === item ? styles.activeTab : ""}>{item}<span>{item === "History" ? queue.filter((episode) => episode.played).length : queue.filter((episode) => !episode.played).length}</span></button>)}</div>
            <div className={styles.episodeList}>{visibleQueue.map((episode) => <article key={episode.id} className={activeEpisode?.id === episode.id ? styles.activeEpisode : styles.episode}>
                <button className={styles.episodePlay} type="button" onClick={() => { setActiveId(episode.id); setPlaying(true); }} aria-label={"Play " + episode.title}>{activeEpisode?.id === episode.id && playing ? <FiPause /> : <FiPlay />}</button>
                <div className={styles.showMark + " " + styles[episode.tint]} aria-hidden="true">{episode.show.slice(0, 1)}</div>
                <div className={styles.episodeText}><strong>{episode.title}</strong><span>{episode.show} / {episode.host}</span></div><span className={styles.length}>{episode.minutes} min</span>
                {!episode.played && <div className={styles.moveButtons}><button type="button" onClick={() => moveEpisode(episode.id, -1)} aria-label={"Move " + episode.title + " up"} disabled={queue.filter((item) => !item.played).findIndex((item) => item.id === episode.id) === 0}><FiChevronUp /></button><button type="button" onClick={() => moveEpisode(episode.id, 1)} aria-label={"Move " + episode.title + " down"} disabled={queue.filter((item) => !item.played).findIndex((item) => item.id === episode.id) === queue.filter((item) => !item.played).length - 1}><FiChevronDown /></button></div>}
                <button type="button" className={styles.removeEpisode} onClick={() => setRemoving(episode)} aria-label={"Remove " + episode.title}><FiTrash2 /></button>
            </article>)}</div>
            {!visibleQueue.length && <p className={styles.empty}>Nothing in this view matches. Try another filter or add an episode.</p>}
        </section>
        <form className={styles.addEpisode} onSubmit={addEpisode}><div><h2>Add an episode</h2><p>It will join the end of your queue.</p></div><label><span>Podcast name</span><input value={newShow} onChange={(event) => setNewShow(event.target.value)} placeholder="Show name" /></label><label><span>Episode title</span><input value={newEpisode} onChange={(event) => setNewEpisode(event.target.value)} placeholder="Episode title" /></label><button type="submit"><FiPlus /> Add to queue</button></form>
        <p className={styles.localNote}>The player is a local listening timer. No audio is streamed or uploaded.</p>
        {removing && <ConfirmDialog title="Remove this episode?" description={removing.title + " will be removed from your queue."} confirmLabel="Remove episode" onCancel={() => setRemoving(null)} onConfirm={deleteEpisode} />}
    </div>;
};

export default PodcastQueueManager;
