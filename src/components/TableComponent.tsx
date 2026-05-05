import { MaterialReactTable } from "material-react-table";

type Props = {
  jasaItems: any[];
  setJasaItems: any;
  partItems: any[];
  setPartItems: any;
  parts: Record<string, any>;
  handleAddJasa: () => void;
  handleAddPart: () => void;
};

export default function EditableServiceTables({
  jasaItems,
  setJasaItems,
  partItems,
  setPartItems,
  parts,
  handleAddJasa,
  handleAddPart,
}: Props) {
  // ================= JASA =================
  const jasaColumns = [
    {
      accessorKey: "name",
      header: "Nama Jasa",
      Cell: ({ row }: any) => {
        const part = parts[row.original.partId];

        return row.original.isNew ? (
          <input
            value={row.original.name ?? ""}
            onChange={(e) => {
              setJasaItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, name: e.target.value }
                    : it
                )
              );
            }}
          />
        ) : (
          part?.name || "-"
        );
      },
    },
    {
      accessorKey: "qty",
      header: "Qty",
      Cell: ({ row }: any) =>
        row.original.isNew ? (
          <input
            type="number"
            value={row.original.qty ?? 0}
            onChange={(e) => {
              setJasaItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, qty: Number(e.target.value) }
                    : it
                )
              );
            }}
            style={{ width: 60 }}
          />
        ) : (
          row.original.qty
        ),
    },
    {
      accessorKey: "price",
      header: "Harga",
      Cell: ({ row }: any) =>
        row.original.isNew ? (
          <input
            type="number"
            value={row.original.price ?? 0}
            onChange={(e) => {
              setJasaItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, price: Number(e.target.value) }
                    : it
                )
              );
            }}
          />
        ) : (
          `Rp ${row.original.price.toLocaleString("id-ID")}`
        ),
    },
    {
      header: "Total",
      Cell: ({ row }: any) =>
        `Rp ${(row.original.qty * row.original.price).toLocaleString("id-ID")}`,
    },
  ];

  // ================= PART =================
  const partColumns = [
    {
      accessorKey: "packageName",
      header: "Package",
      Cell: ({ row }: any) =>
        row.original.isNew ? (
          <input
            value={row.original.packageName ?? ""}
            onChange={(e) => {
              setPartItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, packageName: e.target.value }
                    : it
                )
              );
            }}
          />
        ) : (
          row.original.packageName || "-"
        ),
    },
    {
      accessorKey: "name",
      header: "Nama Item",
      Cell: ({ row }: any) => {
        const part = parts[row.original.partId];

        return row.original.isNew ? (
          <input
            value={row.original.name ?? ""}
            onChange={(e) => {
              setPartItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, name: e.target.value }
                    : it
                )
              );
            }}
          />
        ) : (
          part?.name || "-"
        );
      },
    },
    {
      accessorKey: "qty",
      header: "Qty",
      Cell: ({ row }: any) =>
        row.original.isNew ? (
          <input
            type="number"
            value={row.original.qty ?? 0}
            onChange={(e) => {
              setPartItems((prev: any[]) =>
                prev.map((it) =>
                  it.id === row.original.id
                    ? { ...it, qty: Number(e.target.value) }
                    : it
                )
              );
            }}
            style={{ width: 60 }}
          />
        ) : (
          row.original.qty
        ),
    },
    {
      header: "Total",
      Cell: ({ row }: any) =>
        `Rp ${(row.original.qty * row.original.price).toLocaleString("id-ID")}`,
    },
  ];

  return (
    <>
      <h3>Service</h3>
      <MaterialReactTable
        columns={jasaColumns}
        data={jasaItems}
        enableTopToolbar={false}
        enableBottomToolbar={false}
      />
      <button onClick={handleAddJasa}>+ Tambah Service</button>

      <br />
      <br />

      <h3>Parts</h3>
      <MaterialReactTable
        columns={partColumns}
        data={partItems}
        enableTopToolbar={false}
        enableBottomToolbar={false}
      />
      <button onClick={handleAddPart}>+ Tambah Part</button>
    </>
  );
}
