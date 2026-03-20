import React, { useState, useEffect } from "react";
import {
  fetchPredictionLogs,
  fetchRecentPredictions,
} from "../../services/adminApi";

function AIPredictionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelFilter, setModelFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState(7); // days
  const [statistics, setStatistics] = useState({
    total: 0,
    diabetes: 0,
    heart: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });

  useEffect(() => {
    fetchLogsData();
  }, []);

  const fetchLogsData = async () => {
    try {
      setLoading(true);
      const data = await fetchRecentPredictions(dateRange);
      setLogs(Array.isArray(data) ? data : []);
      calculateStatistics(data);
    } catch (error) {
      console.error("Failed to fetch prediction logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data) => {
    if (!Array.isArray(data)) return;

    const stats = {
      total: data.length,
      diabetes: 0,
      heart: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
    };

    data.forEach((log) => {
      if (log.modelType === "DIABETES") stats.diabetes++;
      if (log.modelType === "HEART") stats.heart++;

      const riskLevel = log.riskLevel || "MEDIUM";
      if (riskLevel === "HIGH") stats.highRisk++;
      else if (riskLevel === "MEDIUM") stats.mediumRisk++;
      else if (riskLevel === "LOW") stats.lowRisk++;
    });

    setStatistics(stats);
  };

  const handleModelFilterChange = (e) => {
    setModelFilter(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const range = parseInt(e.target.value);
    setDateRange(range);
  };

  const handleRefresh = async () => {
    await fetchLogsData();
  };

  const filteredLogs = logs.filter((log) => {
    if (modelFilter !== "ALL" && log.modelType !== modelFilter) {
      return false;
    }
    return true;
  });

  const getRiskLevelColor = (riskLevel) => {
    const level = riskLevel || "MEDIUM";
    switch (level) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRiskLevelIcon = (riskLevel) => {
    const level = riskLevel || "MEDIUM";
    switch (level) {
      case "HIGH":
        return "🔴";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getModelTypeColor = (modelType) => {
    return modelType === "DIABETES"
      ? "bg-red-50 border-red-200"
      : "bg-blue-50 border-blue-200";
  };

  const getModelTypeIcon = (modelType) => {
    return modelType === "DIABETES" ? "🩺 Diabetes" : "❤️ Heart Disease";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseInputData = (inputData) => {
    try {
      if (typeof inputData === "string") {
        const parsed = JSON.parse(inputData);
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      }
      return "N/A";
    } catch {
      return inputData || "N/A";
    }
  };

  const parseResultData = (resultData) => {
    try {
      if (typeof resultData === "string") {
        const parsed = JSON.parse(resultData);
        if (parsed.probability) {
          return `Probability: ${(parsed.probability * 100).toFixed(2)}%`;
        }
        return JSON.stringify(parsed).substring(0, 50);
      }
      return resultData || "N/A";
    } catch {
      return resultData || "N/A";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤖 AI Prediction Logs</h2>
        <button
          onClick={handleRefresh}
          className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">Total Predictions</p>
          <p className="text-2xl font-bold">{statistics.total}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">Diabetes</p>
          <p className="text-2xl font-bold">{statistics.diabetes}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">Heart</p>
          <p className="text-2xl font-bold">{statistics.heart}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">High Risk</p>
          <p className="text-2xl font-bold">{statistics.highRisk}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">Medium Risk</p>
          <p className="text-2xl font-bold">{statistics.mediumRisk}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow">
          <p className="text-xs opacity-90">Low Risk</p>
          <p className="text-2xl font-bold">{statistics.lowRisk}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Model Type
            </label>
            <select
              value={modelFilter}
              onChange={handleModelFilterChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value="ALL">All Models</option>
              <option value="DIABETES">Diabetes Predictions</option>
              <option value="HEART">Heart Disease Predictions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prediction Logs Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading prediction logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No prediction logs found for the selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Model Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Input Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-gray-50 border-l-4 ${
                      log.modelType === "DIABETES"
                        ? "border-red-300"
                        : "border-blue-300"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">
                      {log.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.modelType === "DIABETES"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getModelTypeIcon(log.modelType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {parseInputData(log.inputData)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {parseResultData(log.resultData)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getRiskLevelColor(log.riskLevel)}`}
                      >
                        {getRiskLevelIcon(log.riskLevel)}{" "}
                        {log.riskLevel || "MEDIUM"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> These logs track all AI predictions made by
          the system. Risk levels are calculated based on model probabilities
          (Low: &lt;33%, Medium: 33-67%, High: &gt;67%). Use these logs to
          monitor model performance and identify high-risk patients for
          follow-up care.
        </p>
      </div>
    </div>
  );
}

export default AIPredictionLogs;
