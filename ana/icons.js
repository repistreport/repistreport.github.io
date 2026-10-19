// Çizgisel ikonlar (24 ızgara, stroke = currentColor). Config ikon anahtarıyla başvurur.
window.Rep = window.Rep || {};
Rep.icons = {
  camera: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.6l1.4-2h7l1.4 2h2.6A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.6" r="3.6"/><path d="M17.6 9.8h.01"/>',
  clapper: '<path d="M4 10.5h16v8.3a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 18.8z"/><path d="M4 10.5 3.3 7a1 1 0 0 1 .8-1.2L17.8 3.3a1 1 0 0 1 1.2.8l.6 3.2z"/><path d="M8.3 5.4l2.3 3.3M13.2 4.5l2.3 3.3"/>',
  light: '<path d="M8.5 3.5h7l2 6.5h-11z"/><path d="M12 10v8.5M8 21l4-2.5 4 2.5"/><path d="M4.2 6.3 2.8 5.5M19.8 6.3l1.4-.8M4.5 9.6H3M21 9.6h-1.5"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  sliders: '<path d="M5 4v3M5 11v9M12 4v9M12 17v3M19 4v1M19 9v11"/><circle cx="5" cy="9" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="19" cy="7" r="2"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.6h2"/><path d="M10.6 8.6v5l4-2.5z"/>',
  frames: '<rect x="3.5" y="4" width="7" height="7" rx="1"/><rect x="13.5" y="4" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="7" height="6.5" rx="1"/>'
};
Rep.iconSvg = function (key) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (Rep.icons[key] || '') + '</svg>';
};
