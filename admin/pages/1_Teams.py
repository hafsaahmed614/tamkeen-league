import streamlit as st
import sys
sys.path.append("..")

from config.supabase import get_supabase_client

st.set_page_config(page_title="Teams - Tamkeen Admin", page_icon="🏀", layout="wide")

# Mobile-friendly CSS
st.markdown("""
<style>
    .team-card {
        padding: 12px 0;
        border-bottom: 1px solid #333;
    }
    .team-name {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 8px;
    }
    .team-record {
        display: flex;
        gap: 20px;
        margin-bottom: 12px;
    }
    .record-item {
        font-size: 14px;
    }
</style>
""", unsafe_allow_html=True)

st.title("Team Management")
st.divider()

# Initialize Supabase client
try:
    supabase = get_supabase_client()
    connected = True
except ValueError as e:
    st.error(str(e))
    connected = False

if connected:
    # Fetch existing teams
    @st.cache_data(ttl=60)
    def fetch_teams():
        response = supabase.table("teams").select("*").order("name").execute()
        return response.data

    # Show success message if one exists from previous action
    if "success_msg" in st.session_state:
        st.success(st.session_state.pop("success_msg"))

    # Add new team section
    st.subheader("Add New Team")
    with st.form("add_team_form"):
        new_team_name = st.text_input("Team Name")
        submitted = st.form_submit_button("Add Team", use_container_width=True)

        if submitted and new_team_name:
            try:
                supabase.table("teams").insert({"name": new_team_name}).execute()
                st.session_state["success_msg"] = f"'{new_team_name}' team was added!"
                st.cache_data.clear()
                st.rerun()
            except Exception as e:
                st.error(f"Error adding team: {e}")

    st.divider()

    # Display existing teams
    st.subheader("Existing Teams")

    teams = fetch_teams()

    if teams:
        for team in teams:
            with st.container():
                # Team name and record on one line
                st.markdown(f"**{team['name']}** — Record: {team['wins']}-{team['losses']}")

                # Action buttons side by side
                btn_col1, btn_col2, btn_col3 = st.columns([1, 1, 2])
                with btn_col1:
                    if st.button("Edit", key=f"edit_{team['id']}", use_container_width=True):
                        st.session_state[f"editing_{team['id']}"] = True
                with btn_col2:
                    if st.button("Delete", key=f"delete_{team['id']}", use_container_width=True):
                        try:
                            supabase.table("teams").delete().eq("id", team['id']).execute()
                            st.success(f"Team '{team['name']}' deleted!")
                            st.cache_data.clear()
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error deleting team: {e}")

                # Edit form (shown when edit button is clicked)
                if st.session_state.get(f"editing_{team['id']}", False):
                    with st.form(f"edit_form_{team['id']}"):
                        new_name = st.text_input("New Team Name", value=team['name'])
                        col_save, col_cancel = st.columns(2)
                        with col_save:
                            if st.form_submit_button("Save", use_container_width=True):
                                try:
                                    supabase.table("teams").update({"name": new_name}).eq("id", team['id']).execute()
                                    st.success("Team updated!")
                                    st.session_state[f"editing_{team['id']}"] = False
                                    st.cache_data.clear()
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Error updating team: {e}")
                        with col_cancel:
                            if st.form_submit_button("Cancel", use_container_width=True):
                                st.session_state[f"editing_{team['id']}"] = False
                                st.rerun()

                st.divider()
    else:
        st.info("No teams found. Add your first team above!")
else:
    st.warning("Please configure your Supabase credentials to manage teams.")
