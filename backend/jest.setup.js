jest.mock('google-spreadsheet', () => {
  return {
    GoogleSpreadsheet: jest.fn().mockImplementation(() => {
      return {
        loadInfo: jest.fn(),
        title: 'Mock Spreadsheet',
        sheetsByTitle: {},
        addSheet: jest.fn(),
      };
    }),
  };
});
