  if (
    (void 0 === u && void 0 !== d
      ? ((u = 0),
        (l = {
          defaulted: "offset",
          offset: 0,
          limit: d,
          reason:
            "offset was not provided; defaulted to 0 (read from start of file). To read a different range, retry with both offset and limit.",
        }))
      : void 0 !== u &&
        void 0 === d &&
        ((d = 2e3),
        (l = {
          defaulted: "limit",
          offset: u,
          limit: 2e3,
          reason:
            "limit was not provided; defaulted to 2000 lines. To read more or fewer lines, retry with both offset and limit.",
        })),
