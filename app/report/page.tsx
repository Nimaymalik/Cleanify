"use client";

import { useState, useEffect } from "react";
import { Upload, Loader } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

import {
  createReport,
  createUser,
  getRecentReports,
  getUserByEmail,
} from "../../utils/database/action";

// Type definitions
type User = {
  id: number;
  email: string;
  name: string;
};

type Report = {
  id: number;
  location: string;
  type: string;
  amount: string;
  imageUrl: string | null;
  createdAt: Date;
  userId: number;
};

export default function ReportPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Array<Report>>([]);
  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewReport({ ...newReport, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) {
      toast.error("Please log in to submit a report.");
      return;
    }

    if (!newReport.location || !newReport.type || !newReport.amount) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport(
        dbUser.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview ?? undefined
      );

      if (report) {
        const formattedReport = {
          id: report.id,
          location: report.location,
          type: report.wasteType,
          amount: report.amount,
          imageUrl: report.imageUrl ?? null,
          createdAt: new Date(report.createdAt),
          userId: report.userId,
        };
        setReports([formattedReport, ...reports]);
        setNewReport({ location: "", type: "", amount: "" });
        setPreview(null);
        toast.success("Report submitted successfully!");
        window.location.reload();
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        toast.error("Please log in to access this page.");
        return;
      }

      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) {
        toast.error("User email not available. Please log in again.");
        return;
      }

      let fetchedUser = await getUserByEmail(userEmail);
      if (!fetchedUser) {
        fetchedUser = await createUser(userEmail, user?.fullName || "Anonymous User");
      }
      setDbUser(fetchedUser);

      const recentReports = await getRecentReports();
      const formattedReports = recentReports.map((report) => ({
        ...report,
        type: report.wasteType,
        createdAt: new Date(report.createdAt),
      }));
      setReports(formattedReports);
    };
    checkUser();
  }, [user, isSignedIn, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-6 text-gray-800">
            Please Log In
          </h1>
          <p className="text-gray-600">
            You need to be logged in to submit waste reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Report waste
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Submit New Report
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Type
              </label>
              <select
                name="type"
                value={newReport.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select waste type</option>
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="glass">Glass</option>
                <option value="metal">Metal</option>
                <option value="organic">Organic</option>
                <option value="electronic">Electronic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="text"
                name="amount"
                value={newReport.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 2.5 kg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload image
                  </span>
                </label>
              </div>
            </div>

            {preview && (
              <div className="mt-4">
                <Image
                  src={preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md"
                  width={400}
                  height={128}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Recent Reports
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800">
                      {report.location}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {report.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Type: {report.type}</p>
                    <p>Amount: {report.amount}</p>
                  </div>
                  {report.imageUrl && (
                    <Image
                      src={report.imageUrl}
                      alt="Report"
                      className="w-full h-20 object-cover rounded-md mt-2"
                      width={400}
                      height={80}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No reports yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
