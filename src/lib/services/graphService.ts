import { supabase } from "@/integrations/supabase/client";
import type { GraphNode, GraphEdge } from "@/lib/graphrag";

/**
 * Fetch all graph nodes for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getGraphNodes = async (profileId: string): Promise<GraphNode[]> => {
  try {
    const { data, error } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("profile_id", profileId);

    if (error) {
      console.error("graphService.getGraphNodes error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      entity_type: row.entity_type || "Memory",
      label: row.label || "",
      properties: row.properties || {},
    }));
  } catch (err) {
    console.error("graphService.getGraphNodes unexpected error:", err);
    return [];
  }
};

/**
 * Fetch all graph edges for a profile from the database.
 * Returns an empty array when no data exists — never fabricates.
 */
export const getGraphEdges = async (profileId: string): Promise<GraphEdge[]> => {
  try {
    const { data, error } = await supabase
      .from("knowledge_graph_edges")
      .select("*")
      .eq("profile_id", profileId);

    if (error) {
      console.error("graphService.getGraphEdges error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      source: row.source_node_id || "",
      target: row.target_node_id || "",
      type: row.relationship_type || "CONNECTED_TO",
      properties: row.properties || {},
    }));
  } catch (err) {
    console.error("graphService.getGraphEdges unexpected error:", err);
    return [];
  }
};

/**
 * Insert a graph node into the database.
 */
export const addGraphNode = async (profileId: string, node: GraphNode): Promise<GraphNode | null> => {
  try {
    const { data, error } = await supabase
      .from("knowledge_graph_nodes")
      .insert([{
        profile_id: profileId,
        entity_type: node.entity_type,
        label: node.label,
        properties: node.properties,
      }])
      .select()
      .single();

    if (error) {
      console.error("graphService.addGraphNode error:", error);
      return null;
    }

    return {
      id: data.id,
      entity_type: data.entity_type || "Memory",
      label: data.label || "",
      properties: data.properties || {},
    };
  } catch (err) {
    console.error("graphService.addGraphNode unexpected error:", err);
    return null;
  }
};

/**
 * Insert a graph edge into the database.
 */
export const addGraphEdge = async (profileId: string, edge: GraphEdge): Promise<GraphEdge | null> => {
  try {
    const { data, error } = await supabase
      .from("knowledge_graph_edges")
      .insert([{
        profile_id: profileId,
        source_node_id: edge.source,
        target_node_id: edge.target,
        relationship_type: edge.type,
        properties: edge.properties,
      }])
      .select()
      .single();

    if (error) {
      console.error("graphService.addGraphEdge error:", error);
      return null;
    }

    return {
      id: data.id,
      source: data.source_node_id || "",
      target: data.target_node_id || "",
      type: data.relationship_type || "CONNECTED_TO",
      properties: data.properties || {},
    };
  } catch (err) {
    console.error("graphService.addGraphEdge unexpected error:", err);
    return null;
  }
};
