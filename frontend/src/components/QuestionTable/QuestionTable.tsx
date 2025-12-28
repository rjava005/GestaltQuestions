





export function QuestionTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [theme] = useTheme();

  const { questions } =
    QuestionCollectionContext();
  

  const paged = useMemo(
    () => questions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [questions, page, rowsPerPage]
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };



  return (
    <div className="w-full lg:w-3/4 mt-10">
      <TableContainer
        component={Paper}
        className="rounded-lg shadow-md dark:bg-gray-900"
      >

        <Table aria-label="question table" stickyHeader>
          {/* Define the table cols */}
          <TableHead>
            <TableRow>
              {ValidTableCol.map((v, index) => {
                // Skip the first column when multiSelect is true
                if (!multiSelect && v === "Select") return null;

                return (
                  <TableCell key={index} sx={tableHeaderSx(theme)}>
                    {v}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          {/* The Actual Body of the questions */}
          <TableBody>
            {paged.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex justify-end mt-4">
        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
          count={questions.length}
          component="div"
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color:
              theme === "dark" ? "var(--text-primary)" : "var(--primary-blue)",
          }}
        />
      </div>
    </div>
  );
}
