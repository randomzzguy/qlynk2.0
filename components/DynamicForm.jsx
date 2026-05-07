'use client';

import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Dynamic Form Component
 * Generates form fields based on theme schema configuration
 */
export default function DynamicForm({ fields, data, onChange }) {
    const handleFieldChange = (fieldName, value) => {
        onChange({
            ...data,
            [fieldName]: value
        });
    };

    const handleArrayAdd = (fieldName, defaultItem) => {
        const currentArray = data[fieldName] || [];
        onChange({
            ...data,
            [fieldName]: [...currentArray, defaultItem]
        });
    };

    const handleArrayRemove = (fieldName, index) => {
        const currentArray = data[fieldName] || [];
        onChange({
            ...data,
            [fieldName]: currentArray.filter((_, i) => i !== index)
        });
    };

    const handleArrayItemChange = (fieldName, index, itemFieldName, value) => {
        const currentArray = data[fieldName] || [];
        const updatedArray = currentArray.map((item, i) =>
            i === index ? { ...item, [itemFieldName]: value } : item
        );
        onChange({
            ...data,
            [fieldName]: updatedArray
        });
    };

    const renderField = (field) => {
        const value = data[field.name] || '';

        // Array fields (e.g., services, testimonials)
        if (field.type === 'array') {
            const arrayValue = data[field.name] || [];
            const defaultItem = field.itemFields.reduce((acc, f) => {
                acc[f.name] = '';
                return acc;
            }, {});

            return (
                <div key={field.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-gray-700">
                            {field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                            {!field.required && <span className="text-gray-400 ml-2">(Optional)</span>}
                        </label>
                        <button
                            type="button"
                            onClick={() => handleArrayAdd(field.name, defaultItem)}
                            className="flex items-center gap-2 px-3 py-1 text-sm font-bold text-[#f46530] hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add {field.name.slice(0, -1)}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {arrayValue.map((item, index) => (
                            <motion.div
                                key={index}
                                className="p-4 border-2 border-gray-200 rounded-xl space-y-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-gray-600">
                                        {field.name.slice(0, -1)} #{index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleArrayRemove(field.name, index)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {field.itemFields.map(itemField => (
                                    <div key={itemField.name}>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">
                                            {itemField.label || itemField.name}
                                        </label>
                                        {itemField.type === 'textarea' ? (
                                            <div>
                                                <textarea
                                                    value={item[itemField.name] || ''}
                                                    onChange={(e) => handleArrayItemChange(field.name, index, itemField.name, e.target.value)}
                                                    maxLength={itemField.maxLength}
                                                    className="w-full px-4 py-2 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                                                    rows={3}
                                                />
                                                {itemField.maxLength && (
                                                    <p className={`text-xs mt-1 text-right ${(item[itemField.name] || '').length > itemField.maxLength * 0.9
                                                            ? 'text-orange-600 font-semibold'
                                                            : 'text-gray-500'
                                                        }`}>
                                                        {(item[itemField.name] || '').length} / {itemField.maxLength}
                                                    </p>
                                                )}
                                            </div>
                                        ) : itemField.type === 'number' ? (
                                            <input
                                                type="number"
                                                value={item[itemField.name] || ''}
                                                onChange={(e) => handleArrayItemChange(field.name, index, itemField.name, parseInt(e.target.value))}
                                                min={itemField.min}
                                                max={itemField.max}
                                                className="w-full px-4 py-2 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                                            />
                                        ) : (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={item[itemField.name] || ''}
                                                    onChange={(e) => handleArrayItemChange(field.name, index, itemField.name, e.target.value)}
                                                    maxLength={itemField.maxLength}
                                                    className="w-full px-4 py-2 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                                                />
                                                {itemField.maxLength && itemField.type === 'text' && (
                                                    <p className={`text-xs mt-1 text-right ${(item[itemField.name] || '').length > itemField.maxLength * 0.9
                                                            ? 'text-orange-600 font-semibold'
                                                            : 'text-gray-500'
                                                        }`}>
                                                        {(item[itemField.name] || '').length} / {itemField.maxLength}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </div>
            );
        }

        // Regular fields
        return (
            <div key={field.name}>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    {field.label || field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {!field.required && <span className="text-gray-400 ml-2">(Optional)</span>}
                </label>

                {field.type === 'textarea' ? (
                    <div>
                        <textarea
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.required}
                            maxLength={field.maxLength}
                            className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                            rows={4}
                            placeholder={field.placeholder}
                        />
                        {field.maxLength && (
                            <p className={`text-xs mt-1 text-right ${value.length > field.maxLength * 0.9
                                    ? 'text-orange-600 font-semibold'
                                    : 'text-gray-500'
                                }`}>
                                {value.length} / {field.maxLength}
                            </p>
                        )}
                    </div>
                ) : field.type === 'email' ? (
                    <input
                        type="email"
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                        placeholder={field.placeholder}
                    />
                ) : field.type === 'url' ? (
                    <input
                        type="url"
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                        placeholder={field.placeholder || 'https://'}
                    />
                ) : field.type === 'number' ? (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value))}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                        placeholder={field.placeholder}
                    />
                ) : (
                    <div>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.required}
                            maxLength={field.maxLength}
                            className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-lg focus:border-[#f46530] focus:outline-none transition-colors"
                            placeholder={field.placeholder}
                        />
                        {field.maxLength && (
                            <p className={`text-xs mt-1 text-right ${value.length > field.maxLength * 0.9
                                    ? 'text-orange-600 font-semibold'
                                    : 'text-gray-500'
                                }`}>
                                {value.length} / {field.maxLength}
                            </p>
                        )}
                    </div>
                )}


            </div>
        );
    };

    return (
        <div className="space-y-6">
            {fields.map(field => renderField(field))}
        </div>
    );
}
