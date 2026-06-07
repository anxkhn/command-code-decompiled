  if (
    (void 0 === offset && void 0 !== limit
      ? ((offset = 0),
        (defaultInfo = {
          defaulted: "offset",
          offset: 0,
          limit: limit,
          reason:
            "offset was not provided; defaulted to 0 (read from start of file). To read a different range, retry with both offset and limit.",
        }))
      : void 0 !== offset &&
        void 0 === limit &&
        ((limit = 2e3),
        (defaultInfo = {
          defaulted: "limit",
          offset: offset,
          limit: 2e3,
          reason:
            "limit was not provided; defaulted to 2000 lines. To read more or fewer lines, retry with both offset and limit.",
        })),
