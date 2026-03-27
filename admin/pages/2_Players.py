import streamlit as st
import sys
sys.path.append("..")

from config.supabase import get_supabase_client

st.set_page_config(page_title="Players - Tamkeen Admin", page_icon="🏀", layout="wide")

st.title("Player Management")
st.divider()

# Initialize Supabase client
try:
    supabase = get_supabase_client()
    connected = True
except ValueError as e:
    st.error(str(e))
    connected = False

if connected:
    # Fetch teams for dropdown
    @st.cache_data(ttl=60)
    def fetch_teams():
        response = supabase.table("teams").select("name").order("name").execute()
        return response.data

    # Fetch players
    @st.cache_data(ttl=60)
    def fetch_players():
        response = supabase.table("players").select("*").order("name").execute()
        return response.data

    teams = fetch_teams()

    if not teams:
        st.warning("No teams found. Please create teams first before adding players.")
    else:
        # Create team name list
        team_names = [team['name'] for team in teams]

        # Show success message if one exists from previous action
        if "success_msg" in st.session_state:
            st.success(st.session_state.pop("success_msg"))

        # Add new player section
        st.subheader("Add New Player")
        with st.form("add_player_form"):
            col1, col2, col3 = st.columns([2, 2, 1])

            with col1:
                player_name = st.text_input("Player Name")
            with col2:
                selected_team = st.selectbox("Team", options=team_names)
            with col3:
                jersey_number = st.number_input("Jersey #", min_value=0, max_value=99, value=0)

            submitted = st.form_submit_button("Add Player", use_container_width=True)

            if submitted and player_name and selected_team:
                try:
                    supabase.table("players").insert({
                        "name": player_name,
                        "team_name": selected_team,
                        "jersey_number": jersey_number
                    }).execute()
                    st.session_state["success_msg"] = f"'{player_name}' was added to {selected_team}!"
                    st.cache_data.clear()
                    st.rerun()
                except Exception as e:
                    if "unique" in str(e).lower():
                        st.error(f"Jersey #{jersey_number} is already taken on this team.")
                    else:
                        st.error(f"Error adding player: {e}")

        st.divider()

        # Filter by team
        st.subheader("Team Rosters")
        filter_team = st.selectbox(
            "Filter by Team",
            options=["All Teams"] + team_names,
            key="filter_team"
        )

        players = fetch_players()

        # Apply filter
        if filter_team != "All Teams":
            players = [p for p in players if p['team_name'] == filter_team]

        if players:
            # Group by team for display
            display_teams = team_names if filter_team == "All Teams" else [filter_team]

            for team_name in display_teams:
                team_players = [p for p in players if p['team_name'] == team_name]

                if team_players:
                    st.markdown(f"### {team_name}")

                    for player in sorted(team_players, key=lambda x: x['jersey_number']):
                        col1, col2, col3, col4 = st.columns([1, 3, 1, 1])

                        with col1:
                            st.markdown(f"**#{player['jersey_number']}**")
                        with col2:
                            st.write(player['name'])
                        with col3:
                            if st.button("Edit", key=f"edit_player_{player['id']}"):
                                st.session_state[f"editing_player_{player['id']}"] = True
                        with col4:
                            if st.button("Delete", key=f"delete_player_{player['id']}"):
                                try:
                                    supabase.table("players").delete().eq("id", player['id']).execute()
                                    st.success(f"Player '{player['name']}' removed!")
                                    st.cache_data.clear()
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Error removing player: {e}")

                        # Edit form
                        if st.session_state.get(f"editing_player_{player['id']}", False):
                            with st.form(f"edit_player_form_{player['id']}"):
                                edit_col1, edit_col2, edit_col3 = st.columns([2, 2, 1])
                                with edit_col1:
                                    new_name = st.text_input("Name", value=player['name'])
                                with edit_col2:
                                    current_team_idx = team_names.index(player['team_name']) if player['team_name'] in team_names else 0
                                    new_team = st.selectbox(
                                        "Team",
                                        options=team_names,
                                        index=current_team_idx
                                    )
                                with edit_col3:
                                    new_jersey = st.number_input(
                                        "Jersey #",
                                        min_value=0,
                                        max_value=99,
                                        value=player['jersey_number']
                                    )

                                btn_col1, btn_col2 = st.columns(2)
                                with btn_col1:
                                    if st.form_submit_button("Save", use_container_width=True):
                                        try:
                                            supabase.table("players").update({
                                                "name": new_name,
                                                "team_name": new_team,
                                                "jersey_number": new_jersey
                                            }).eq("id", player['id']).execute()
                                            st.success("Player updated!")
                                            st.session_state[f"editing_player_{player['id']}"] = False
                                            st.cache_data.clear()
                                            st.rerun()
                                        except Exception as e:
                                            st.error(f"Error updating player: {e}")
                                with btn_col2:
                                    if st.form_submit_button("Cancel", use_container_width=True):
                                        st.session_state[f"editing_player_{player['id']}"] = False
                                        st.rerun()

                    st.divider()
        else:
            st.info("No players found. Add players using the form above!")
else:
    st.warning("Please configure your Supabase credentials to manage players.")
