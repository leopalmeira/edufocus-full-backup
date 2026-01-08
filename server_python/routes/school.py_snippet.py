
# ==========================================
# ROTAS DE FREQUÊNCIA DE ALUNOS (PAINEL ESCOLA)
# ==========================================
@school_bp.route('/api/school/<int:school_id>/attendance', methods=['GET'])
@school_bp.route('/api/school/attendance', methods=['GET'])
@token_required
def get_school_attendance(school_id=None):
    if not school_id:
        school_id = g.user.get('school_id') or g.user.get('id')
    
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    try:
        db = get_school_db(school_id)
        
        # Query base juntando com alunos para pegar nomes e turmas
        query = '''
            SELECT a.id, a.student_id, a.timestamp, a.type, 
                   s.name as student_name, s.class_name, s.photo_url
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE 1=1
        '''
        params = []
        
        if start_date:
            # Compatibilidade com ISO e YYYY-MM-DD
            query += " AND a.timestamp >= ?"
            params.append(start_date)
        
        if end_date:
            # Se for apenas data, considere até o final do dia
            if len(end_date) == 10:
                 end_date_full = end_date + 'T23:59:59'
                 # Tentar cobrir UTCZ tbm
            else:
                 end_date_full = end_date
            
            # Usar LIKE para filtro de dia se for igual, ou intervalo
            # Simplificação: String comparison funciona bem com ISO8601
            query += " AND a.timestamp <= ?"
            params.append(end_date_full + 'Z') # Margem de segurança ou sufixo
            
        query += " ORDER BY a.timestamp DESC"
        
        # Ajuste fino para param de data:
        # Se start e end são iguais (ex carregando hoje), usar LIKE
        if start_date and end_date and start_date == end_date:
             query = '''
                SELECT a.id, a.student_id, a.timestamp, a.type, 
                       s.name as student_name, s.class_name, s.photo_url
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                WHERE a.timestamp LIKE ?
                ORDER BY a.timestamp DESC
             '''
             params = [f"{start_date}%"]

        rows = db.execute(query, params).fetchall()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        print(f"Erro em get_school_attendance: {e}")
        return jsonify([])
