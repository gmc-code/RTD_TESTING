.parsons-line {
  position: relative;
  padding-left: 3rem;  /* make room for numbers */
  font-family: var(--pst-font-monospace, monospace);
}

/* Line number prefix (JS or directive inserts data-line) */
.parsons-line::before {
  content: attr(data-line) " | ";
  position: absolute;
  left: 0.6rem;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  color: #888;
  font-weight: bold;
  pointer-events: none;
  white-space: pre;
}

