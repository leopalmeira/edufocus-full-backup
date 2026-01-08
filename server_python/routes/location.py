from flask import Blueprint, request, jsonify
import googlemaps
import os

location_bp = Blueprint('location', __name__)

# Tenta inicializar o cliente.
try:
    # CHAVE CORRETA HARDCODED PARA GARANTIR
    gmaps = googlemaps.Client(key='AIzaSyDLeiJNyO0Jghvq7Cx7bx8wbe6QNSDeeRI') 
except Exception as e:
    gmaps = None
    print(f"Erro ao inicializar Google Maps Client: {e}")

@location_bp.route('/api/location/autocomplete', methods=['GET'])
def autocomplete():
    if not gmaps:
        return jsonify({'error': 'Google Maps não configurado'}), 500
    
    input_text = request.args.get('input')
    if not input_text:
        return jsonify([])

    try:
        # Restringe busca ao Brasil e retorna apenas geocodes (endereços)
        places = gmaps.places_autocomplete(
            input_text=input_text,
            components={'country': 'br'},
            types='geocode'
        )
        return jsonify(places)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/api/location/details', methods=['GET'])
def place_details():
    if not gmaps:
        return jsonify({'error': 'Google Maps não configurado'}), 500

    place_id = request.args.get('place_id')
    if not place_id:
        return jsonify({'error': 'Place ID missing'}), 400

    try:
        # Pega detalhes do lugar (geometria = lat/lng)
        place = gmaps.place(place_id, fields=['geometry', 'formatted_address', 'address_component'])
        
        result = place.get('result', {})
        geometry = result.get('geometry', {}).get('location', {})
        address_components = result.get('address_components', [])
        
        # Extrair dados úteis
        number = next((c['long_name'] for c in address_components if 'street_number' in c['types']), '')
        zip_code = next((c['long_name'] for c in address_components if 'postal_code' in c['types']), '')
        route = next((c['long_name'] for c in address_components if 'route' in c['types']), '')

        return jsonify({
            'latitude': geometry.get('lat'),
            'longitude': geometry.get('lng'),
            'address': f"{route}", # Rua
            'full_address': result.get('formatted_address'),
            'number': number,
            'zip_code': zip_code
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/api/location/reverse', methods=['GET'])
def reverse_geocode():
    if not gmaps:
        return jsonify({'error': 'Google Maps não configurado'}), 500

    lat = request.args.get('lat')
    lng = request.args.get('lng')
    
    if not lat or not lng:
        return jsonify({'error': 'Coords missing'}), 400

    try:
        # Reverse geocode
        results = gmaps.reverse_geocode((lat, lng))
        if not results:
            return jsonify({})
        
        # Pega o primeiro (mais preciso)
        first = results[0]
        address_components = first.get('address_components', [])
        
        number = next((c['long_name'] for c in address_components if 'street_number' in c['types']), '')
        zip_code = next((c['long_name'] for c in address_components if 'postal_code' in c['types']), '')
        route = next((c['long_name'] for c in address_components if 'route' in c['types']), '')
        
        return jsonify({
            'address': route,
            'full_address': first.get('formatted_address'),
            'number': number,
            'zip_code': zip_code,
            'latitude': lat,
            'longitude': lng
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@location_bp.route('/api/location/geocode', methods=['GET'])
def geocode_address():
    if not gmaps:
        return jsonify({'error': 'Google Maps não configurado'}), 500

    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Endereço faltando'}), 400

    try:
        # Geocode normal
        results = gmaps.geocode(address)
        if not results:
            return jsonify({'error': 'Endereço não encontrado'}), 404
        
        # Pega o primeiro
        first = results[0]
        geometry = first.get('geometry', {}).get('location', {})
        
        return jsonify({
            'latitude': geometry.get('lat'),
            'longitude': geometry.get('lng'),
            'formatted_address': first.get('formatted_address')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
