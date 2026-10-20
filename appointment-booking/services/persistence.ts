import mongoose from "mongoose";
import { AppointmentStateModel, BookingRecordModel } from "../models/appointment.js";
import { IAppointmentState } from "../types.js";

export const AppointmentPersistence = {
  async loadState(waUserId: string): Promise<IAppointmentState | null> {
      const doc = await AppointmentStateModel.findOne({ waUserId }).lean();
      if (!doc) return null;
      return {
        waUserId: doc.waUserId,
        flowId: doc.flowId,
        flowVersion: doc.flowVersion,
        currentNodeId: doc.currentNodeId,
        context: doc.context || {},
        retryCount: doc.retryCount || 0,
        status: doc.status || "active",
        lastInboundText: doc.lastInboundText || undefined,
        lastTransitionAt: doc.lastTransitionAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      };
  },

  async saveState(state: IAppointmentState): Promise<void> {
    state.updatedAt = new Date();
    if (AppointmentStateModel && mongoose.connection.readyState === 1) {
      await AppointmentStateModel.findOneAndUpdate(
        { waUserId: state.waUserId },
        { $set: state },
        { upsert: true, new: true }
      );
      return;
    }
  },

  async saveBooking(booking: any): Promise<void> {
      await BookingRecordModel.findOneAndUpdate(
        { bookingId: booking.bookingId },
        { $set: booking },
        { upsert: true, new: true }
      );
      return;
  },

  async findBookingByUser(waUserId: string): Promise<any | null> {
      return await BookingRecordModel.findOne({ waUserId, status: "confirmed" })
        .sort({ createdAt: -1 })
        .lean();
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
      const res = await BookingRecordModel.updateOne(
        { bookingId },
        { $set: { status: "cancelled" } }
      );
      return res.modifiedCount > 0;
  },
};