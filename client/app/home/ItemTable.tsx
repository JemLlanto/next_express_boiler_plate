import { ItemDataProps, itemService } from "@/services/Item.service";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import Swal from "sweetalert2";

interface ItemTableProps {
  currentItems: ItemDataProps[];
  isLoading: boolean;
  openAddModal: () => void;
  openEditModal: (item: ItemDataProps) => void;
  setCurrentItems: Dispatch<SetStateAction<ItemDataProps[]>>;
}

const ItemTable = ({
  currentItems,
  isLoading,
  openAddModal,
  openEditModal,
  setCurrentItems,
}: ItemTableProps) => {
  const handleDelete = async (item: ItemDataProps) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Delete "${item.name}"?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await itemService("DELETE", item.item_id);

      if (response.success) {
        setCurrentItems((prev) =>
          prev.filter((i) => i.item_id !== item.item_id),
        );
        Swal.fire({
          icon: "success",
          title: "Item deleted",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Unexpected Error: ", err);
    }
  };

  return (
    <div className="w-full mx-auto p-5 bg-white border border-gray-200 rounded-xl shadow-sm font-sans">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-neutral-800">Line Items</h4>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white text-sm font-medium px-3.5 py-2 hover:bg-neutral-700 transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 border-b border-neutral-300 pb-2 px-2">
        <h5 className="text-left font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Item Name
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Quantity
        </h5>
        <h5 className="text-center font-semibold text-sm text-neutral-500 uppercase tracking-wide">
          Price
        </h5>
        <h5 className="text-right font-semibold text-sm text-neutral-500 uppercase tracking-wide w-20">
          Actions
        </h5>
      </div>

      {/* Rows */}
      {isLoading ? (
        <p className="text-center text-neutral-400 py-8 text-sm">Loading...</p>
      ) : currentItems.length === 0 ? (
        <p className="text-center text-neutral-400 py-8 text-sm">
          No items yet. Click "Add Item" to get started.
        </p>
      ) : (
        currentItems.map((item, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center py-3 px-2 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
          >
            <p className="text-left text-neutral-800">{item.name}</p>
            <p className="text-center text-neutral-600">{item.quantity}</p>
            <p className="text-center text-neutral-600">
              ${Number(item.price).toFixed(2)}
            </p>
            <div className="flex justify-end gap-1 w-20">
              <button
                onClick={() => openEditModal(item)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label={`Edit ${item.name}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ItemTable;
