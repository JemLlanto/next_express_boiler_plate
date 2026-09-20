"use client";
import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slice/userDataSlice";
import { setItems } from "@/store/slice/itemData.slice";
import {
  emptyForm,
  getChangedFields,
  ItemDataProps,
  ItemFormDataProps,
  itemService,
} from "@/services/Item.service";
import { setIsLoading } from "@/store/slice/isLoading.slice";
import ItemTable from "./ItemTable";

const HomePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.itemData);
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const [currentItems, setCurrentItems] = useState<ItemDataProps[]>(items);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalItem, setOriginalItem] =
    useState<ItemFormDataProps>(emptyForm);
  const [form, setForm] = useState<ItemFormDataProps>(emptyForm);
  const [errors, setErrors] = useState<Partial<ItemFormDataProps>>({});

  // Checking user authorization
  useEffect(() => {
    const validateUser = async () => {
      dispatch(setIsLoading(true));
      try {
        const response = await checkUser();
        if (response.success) {
          // Set user data
          dispatch(setUser(response.user));
          // Getting user items
          const itemRes = await itemService("GET");
          console.log("itemRes: ", itemRes.items);
          // Set items data
          dispatch(setItems(itemRes.items));
        } else {
          // Redirect to the landing page if not authenticated.
          router.push(`/auth/login`);
        }
      } catch (err) {
        console.error("Error: ", err);
      } finally {
        setTimeout(() => {
          dispatch(setIsLoading(false));
        }, 100);
      }
    };
    // Calling validateUser function
    validateUser();
  }, []);
  // Update current items on mount
  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  // console.log("form: ", form);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: ItemDataProps) => {
    const form = {
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    };
    setEditingId(item.item_id);
    setOriginalItem(form);
    setForm(form);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<ItemFormDataProps> = {};
    if (!form.name.trim()) newErrors.name = "Item name is required";
    if (!form.quantity || Number(form.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";
    if (!form.price || Number(form.price) < 0)
      newErrors.price = "Price must be a valid amount";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (editingId !== null) {
      // Edit existing item
      try {
        const changes = getChangedFields(originalItem, form);

        const response = await itemService("PATCH", editingId, changes);

        if (response.success) {
          // Prepare the updated data
          const updatedItem: ItemDataProps = {
            item_id: response.item.item_id,
            name: response.item.name,
            quantity: response.item.quantity,
            price: response.item.price,
            created_at: response.item.created_at,
            updated_at: response.item.updated_at,
          };
          // Update the changed item
          setCurrentItems((prev) =>
            prev.map((item) =>
              item.item_id === updatedItem.item_id ? updatedItem : item,
            ),
          );

          // Success Message
          Swal.fire({
            icon: "success",
            title: "Item updated",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error Occured: ", err);
      }
    } else {
      // Add new item
      try {
        const response = await itemService("POST", 0, form);
        if (response.success) {
          const newItem: ItemDataProps = {
            item_id: response.item.item_id,
            name: response.item.name,
            quantity: response.item.quantity,
            price: response.item.price,
            created_at: response.item.created_at,
            updated_at: response.item.updated_at,
          };
          setCurrentItems((prev) => [newItem, ...prev]);
          Swal.fire({
            icon: "success",
            title: "Item added",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error Occured: ", err);
      }
    }

    closeModal();
  };

  return (
    <>
      <div className="pt-2">
        <ItemTable
          currentItems={currentItems}
          isLoading={isLoading}
          openAddModal={openAddModal}
          openEditModal={openEditModal}
          setCurrentItems={setCurrentItems}
        />

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                {editingId !== null ? "Edit Item" : "Add Item"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                      errors.name ? "border-red-400" : "border-neutral-300"
                    }`}
                    placeholder="e.g. Widget A"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={!form.quantity ? "" : form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                      errors.quantity ? "border-red-400" : "border-neutral-300"
                    }`}
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={!form.price ? "" : form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-800 ${
                      errors.price ? "border-red-400" : "border-neutral-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium py-2 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-lg bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-700"
                >
                  {editingId !== null ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
