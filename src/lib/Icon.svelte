<script lang="ts">
  export let name = 'book';
  export let size = 28;
  const paths: Record<string, string> = {
    book: 'M12 5C9 2 4 3 2 4v15c4-1 7-1 10 2m0-16c3-3 8-2 10-1v15c-4-1-7-1-10 2V5Z',
    cards: 'm8 3 12 2-3 15-12-2L8 3Zm-3 2L2 7l4 14 9-2',
    chart: 'M3 21V12h4v9M10 21V7h4v14M17 21V2h4v19',
    settings:
      'm10 2 4 0 1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1 1-3Zm2 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    search: 'm16 16 6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    plus: 'M12 3v18M3 12h18',
    close: 'm5 5 14 14M5 19 19 5',
    minus: 'M4 12h16',
    pin: 'm15 2 7 7-5 1-4 5-1 4-3-3-6 6 5-7-3-3 4-1 5-4 1-5Z',
    play: 'm7 3 14 9-14 9V3Z',
    next: 'm8 4 8 8-8 8',
    back: 'm14 4-8 8 8 8',
    arrow: 'M20 12H4m7-7-7 7 7 7',
    check: 'm3 12 6 6L21 5',
    bookmark: 'M5 3h14v19l-7-5-7 5V3Z',
    note: 'M14 3H4v18h17V10M9 15l1-5L20 1l4 4-10 9-5 1Z',
    file: 'M4 2h10l6 6v14H4V2Zm10 0v7h6M8 13h8M8 17h8',
    folder: 'M2 6h8l2 3h10l-3 12H3L1 6Zm2-4h6l3 3h7v4',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Zm11-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
    clock: 'M12 5v7l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    repeat: 'M3 8a9 9 0 0 1 15-4l3 4M21 2v6h-6M21 16a9 9 0 0 1-15 4l-3-4M3 22v-6h6',
    calendar: 'M3 5h18v17H3V5Zm0 6h18M7 1v7M17 1v7',
    chip: 'M5 5h14v14H5V5Zm4 3h6v8H9V8ZM8 1v4M16 1v4M8 19v4M16 19v4M1 8h4M1 16h4M19 8h4M19 16h4',
    grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
    game: 'M7 6h10c4 0 7 11 5 13s-5-1-7-3H9c-2 2-5 5-7 3S3 6 7 6Zm0 3v6M4 12h6M16 10h.1M19 13h.1',
    sound: 'm3 9 5 0 5-5v16l-5-5H3V9Zm14-2c4 3 4 7 0 10M20 4c6 5 6 11 0 16',
    bell: 'M4 18h16l-3-5V8a5 5 0 0 0-10 0v5l-3 5Zm5 3h6M12 1v2',
    cloud: 'M7 19H5a4 4 0 0 1-1-8 7 7 0 0 1 13-4 6 6 0 0 1 2 12h-2M12 21V10l-4 4m4-4 4 4',
    download: 'M12 2v14m-5-5 5 5 5-5M3 17v5h18v-5',
    link: 'm9 15 6-6M8 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
    star: 'm12 1 3.4 7 7.6 1.1-5.5 5.4 1.3 7.5-6.8-3.6L5.2 22l1.3-7.5L1 9.1 7-1.1L12 1Z',
    trophy:
      'M7 2h10v9a5 5 0 0 1-10 0V2Zm0 3H2v5a5 5 0 0 0 5 5M17 5h5v5a5 5 0 0 1-5 5M12 16v6M7 22h10',
    pause: 'M8 4v16M16 4v16',
    expand: 'M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6',
    info: 'M12 10v7M12 6h.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    brain:
      'M12 5C8-1 2 4 4 8c-6 2-3 10 1 10 0 6 7 6 7 2 0 4 7 4 7-2 4 0 7-8 1-10 2-4-4-9-8-3v15M7 8l3 3M17 8l-3 3M6 15l3-1M18 15l-3-1',
    copy: 'M8 2h14v16H8V2ZM4 6H2v16h14v-2',
    trash: 'M3 5h18M9 5V2h6v3M5 5l1 17h12l1-17M10 9v9M14 9v9',
    cap: 'm1 8 11-6 11 6-11 6L1 8Zm4 3v7c4 3 10 3 14 0v-7M23 8v10',
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={name === 'play' || name === 'pin' ? 'currentColor' : 'none'}
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] ?? paths.book} /></svg
>
