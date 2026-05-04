import {
    createContactService,
    getAllContactsService,
    getContactByIdService,
    readContactService
} from '../service/ContactService.js';

// Fetch all contacts
export const getAllContacts = async (req, res) => {
    try {
        const contacts = await getAllContactsService();
        res.status(200).json(contacts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Fetch one contact by id
export const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await getContactByIdService(id);
        res.status(200).json(contact);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Create a new contact
export const createContact = async (req, res) => {
    try {
        const contact = await createContactService(req.body);
        res.status(201).json(contact);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Mark a contact as read
export const readContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await readContactService(id);
        res.status(200).json(contact);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
